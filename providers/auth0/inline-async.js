const checkAuth = require('./utils/auth')

exports.handler = async (event, context) => {
  try {
    const user = await checkAuth(event)
    console.log('user', user)
    // Do stuff
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: true
      })
    }
  } catch (error) {
    console.log('error', error)
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: error.message,
      })
    }
  }
}
