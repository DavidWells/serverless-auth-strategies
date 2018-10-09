const checkAuth = require('./auth')

module.exports = function authMiddleware(config) {
  return ({
    before: (handler, next) => {
      checkAuth(handler.context).then((user) => {
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
