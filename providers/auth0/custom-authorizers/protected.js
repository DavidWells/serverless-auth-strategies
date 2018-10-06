// Protected function by custom authorizer
module.exports = function protectedFunction(event, context, callback) {
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      private: true,
    })
  })
}
