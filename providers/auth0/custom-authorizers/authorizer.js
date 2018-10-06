const util = require('util')
const checkAuth = require('../utils/auth')

module.exports = (event, context, callback) => {
  checkAuth(event).then((user) => {
    console.log('user', user)
    // Generate IAM policy to access function
    const IAMPolicy = generatePolicy(user.sub, 'Allow', event.methodArn)
    console.log('IAMPolicy:')
    console.log(util.inspect(IAMPolicy, false, null))
    console.log('------------------')
    // Return the policy
    return callback(null, IAMPolicy)
  }).catch((error) => {
    console.log('error', error)
    // return error back to app
    return callback('Unauthorized') // eslint-disable-line
  })
}

function generatePolicy(principalId, effect, resource) {
  let authResponse = {}
  // set User ID
  authResponse.principalId = principalId
  // Add Allow/Deny IAM Statements
  if (effect && resource) {
    const statementOne = {
      Action: 'execute-api:Invoke',
      Effect: effect,
      Resource: resource,
    }
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        statementOne
      ]
    }
    authResponse.policyDocument = policyDocument
  }
  // optionally add additional context for next function to consume
  authResponse.context = {
    'stringKey': 'stringval',
    'numberKey': 123,
    'booleanKey': true
  }
  return authResponse
}
