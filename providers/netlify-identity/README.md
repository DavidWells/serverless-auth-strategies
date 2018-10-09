# Netlify identity + Protected Functions

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Strategies](#strategies)
- [Auth check](#auth-check)
<!-- AUTO-GENERATED-CONTENT:END -->

## Strategies

- [inline](./inline.js)
- [inline async](./inline-async.js)
- [Middleware via middy](./middy.js)
- [Middleware via express](./express)

## Auth check

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./utils/auth.js) -->
<!-- The below code snippet is automatically added from ./utils/auth.js -->
```js
/* Check context for user */
module.exports = function checkAuth(context) {
  return new Promise((resolve, reject) => {
    // Reading the context.clientContext will give us the current user
    const user = context.clientContext && context.clientContext.user
    if (!user) {
      console.log('No claims! Begone!')
      return reject(new Error('No user claims'))
    }
    console.log('user', user)
    return resolve(user)
  })
}
```
<!-- AUTO-GENERATED-CONTENT:END -->
