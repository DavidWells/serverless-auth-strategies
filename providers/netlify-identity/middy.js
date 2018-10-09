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
