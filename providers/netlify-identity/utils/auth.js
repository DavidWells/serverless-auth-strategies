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
