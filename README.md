# Serverless Auth strategies

How do we keep certain functions protected & scoped down to specific users (i.e. admin/paid users)?

This will walk through the different strategies available for authorizing access to your functions.

The code in this repo covers primarily AWS lambda functions but these strategies can apply to any FAAS provider.

## Pick your auth provider

- [Auth0]('./auth0')
- [Netlify](./netlify)
- [add yours](issues)

## Strategies

### Inline auth checking

Inlined function authentication happens inside your function code

We do a check on the auth headers or the body of the request to verify the user is okay to access the function.

```js
const checkAuth = require('./utils/auth')

exports.handler = (event, context, callback) => {
  // Use the event data auth header to verify
  checkAuth(event).then((user) => {
    console.log('user', user)
    // Do stuff
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        data: true
      })
    })
  }).catch((error) => {
    console.log('error', error)
    // return error back to app
    return callback(null, {
      statusCode: 401,
      body: JSON.stringify({
        error: error.message,
      })
    })
  })
}

```

**Benefits of this approach:**

- it's easy to do for a single function. Ship it!

**Drawbacks of this approach:**

- this authentication method is hard to share across multiple functions as your API grows and can lead to non DRY code
- Caching can be a challenge and if your authentication is an expensive operation or takes a while this can result in a slower UX and cost you more in compute time.

### Middleware

Next up we have the middleware approach to authentication. This is still happening at the code level but now your logic that verifies the user is allowed to access the function is abstracted up a level into reusable middleware.

MiddyJs does a great job at enabling a sane middleware approach in lambda functions

```js
const middy = require('middy')
const authMiddleware = require('./utils/middleware')

const protectedFunction = (event, context, callback) => {
  // Do my custom stuff
  console.log('⊂◉‿◉つ This is a protected function')

  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      data: 'auth true'
    })
  })
}

exports.handler = middy(protectedFunction).use(authMiddleware())
```

Our middy middleware looks like this:

```js
const checkAuth = require('./auth')

module.exports = function authMiddleware(config) {
  return ({
    before: (handler, next) => {
      checkAuth(handler.event).then((user) => {
        console.log('user', user)
        // set user data on event
        handler.event.user = user
        // We have the user, trigger next middleware
        return next()
      }).catch((error) => {
        console.log('error', error)
        return handler.callback(null, {
          statusCode: 401,
          body: JSON.stringify({
            error: error.message
          })
        })
      })
    }
  })
}
```

You can also instrument this yourself as seen in the movie demo(link here)

### "Legacy" middleware

This middleware approach is using a familiar web framework with express PR flask and using their an auth module from their ecosystem.

In the case of express, you can use passport strategies in a lambda function

```js
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compression = require('compression')
const morgan = require('morgan')
const serverless = require('serverless-http')
const customLogger = require('./utils/logger')
const auth0CheckAuth = require('./utils/auth0')

/* initialize express */
const app = express()
const router = express.Router()

/*  gzip responses */
router.use(compression())

/* Setup protected routes */
router.get('/', auth0CheckAuth, (req, res) => {
  res.json({
    super: 'Secret stuff here'
  })
})

/* Attach request logger for AWS */
app.use(morgan(customLogger))

/* Attach routes to express instance */
const functionName = 'express'
const routerBasePath = (process.env.NODE_ENV === 'dev') ? `/${functionName}` : `/.netlify/functions/${functionName}/`
app.use(routerBasePath, router)

/* Apply express middlewares */
router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

/* Export lambda ready express app */
exports.handler = serverless(app)
```

**Benefits of this approach:**

* Leverage existing code to GSD

**Cons to this approach:**

* This takes a step backwards in the "serverless" approach to doing things because you have an entire express app bootstrapping on every incoming request
* This will cost more over time with additional ms runtime because of express overhead
* This introduces the idea that monoliths can work in lambda functions and this is considered an anti pattern

## Auth decorators

Similar to auth middleware, decorators wrap the function code and return another function

Some developers prefer this more explicit approach as opposed to middleware

```js
@AuthDecorator // <-- ref to auth wrapper function
function protectedFunction(event, context, callback) {
  // protected logic
}
```

## Custom authorizers

Custom authorizers are a feature from AWS API gateway.

They are essentially another function that checks if the user is authorized to access the next function. If the auth checks out, then request then invokes the next lambda function.

**Benefits to this approach:**

- authorization can be cached with a TTL (time to live). This can save on subsequent requests where the cached authentication doesn't need to make the potential slow auth check each time. This saves on compute time, ergo saves $$

**Drawbacks to this approach:**

- you need to be using AWS API gateway to use custom authorizers

### Proxy level

Similar to custom authorizers, you can verify requests at the proxy level.

This works in Netlify by checking for an http only secure cookie.

If the `nf_jwt` cookie exists in the request headers, Netlify will deserialize it and pass it into the context object of the lambda function

If the cookie is no valid, you can send the request to a non authorized endpoint (http code X)

```
# If visitor has 'nf_jwt' with role set, let them see site.
/.netlify/functions/protected-function /.netlify/functions/protected-function 200! Role=*

# Else, redirect them to login portal site.
/.netlify/functions/protected-function /not-allowed 401!
```

### Single use access token

Some third party services like AWS, and faunaDB make it possible to use single use tokens in the client to invoke their APIs directly.

This means no function middleman to make the API calls to other services.

**Benefits to this approach:**

* Cheaper (no function runtime to pay for)
* Faster (no function latency in the middle)

**Cons to this approach:**

* More complex to setup
* Provider must support secure single use access tokens

For more information on this approach see AWS Cognito docs.
