const UnauthorizedError = require('./unauthorizedError')

module.exports = function(options) {
  let middleware = function(req, res, next) {
    // Reading the context.clientContext will give us the current user
    const user = req.context && req.context.clientContext && req.context.clientContext.user
    if (!user) {
      console.log('No claims! Begone!')
      next(new UnauthorizedError('credentials_required', { message: 'No claims found' }))
    }
    console.log('user', user)
    // Set req user
    // set(req, _resultProperty, result);
    next()
  }

  middleware.UnauthorizedError = UnauthorizedError

  return middleware
}
