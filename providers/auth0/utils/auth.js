import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

/* initialize the JWKS client */
const auth0Domain = process.env.AUTH0_DOMAIN
const auth0Audience = process.env.AUTH0_AUDIENCE || 'universe-theater'
const auth0Issuer = process.env.AUTH0_ISSUER || 'https://adobot.auth0.com/'

const authClient = jwksClient({
  cache: true,
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  audience: auth0Audience,
  issuer: auth0Issuer,
})

/* Check authorization JWT */
module.exports = function checkAuth(event) {
  const alg = 'RS256' // algorithm is RSA http://bit.ly/2xAYygk
  return new Promise((resolve, reject) => {
    console.log('event.headers', event.headers)
    // Handler auth headers AND aws custom authorizers
    const authHeader = event.headers.authorization || event.authorizationToken
    if (!authHeader) {
      const reason = 'Missing event.headers.authorization. You must be signed in to call this function'
      return reject(new Error(reason))
    }
    console.log('event.headers', event.headers)
    // remove "bearer " word from token
    const authToken = authHeader.substring(7)

    // Validate Token is not malformed. AKA fail fast
    let decodedToken
    try {
      decodedToken = jwt.decode(authToken, { complete: true })
    } catch (err) {
      console.log(err)
      return reject(new Error('JWT token is malformed'))
    }

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      return reject(new Error('JWT token is malformed'))
    }

    const kid = decodedToken.header.kid
    // console.log('kid', kid)
    // Get Signing key from auth0
    authClient.getSigningKey(kid, (signError, key) => {
      if (signError) {
        console.log('signing key error', signError)
        return reject(new Error('signing key error'))
      }

      const signingKey = key.publicKey || key.rsaPublicKey
      const opts = { algorithms: alg }

      // Now Verify the jwt token is valid
      try {
        jwt.verify(authToken, signingKey, opts, (verifyError, decoded) => {
          if (verifyError) {
            console.log('Token signature NOT VERIFIED', verifyError)
            return reject(new Error('Token signature NOT VERIFIED'))
          }
          // output for logs
          console.log('------------------')
          console.log('decoded jwt token')
          console.log(decoded)
          console.log('------------------')

          /* if you want to allow only verified emails use this
          if (!decoded.email_verified) {
            console.log('User has not verified email yet', decoded)
            return reject(`Email not verified`)
          }
          /**/

          /* if you want to allow only certain roles use this
          const siteUrl =  config.jwtRoleNamespace || process.env.URL
          const roles = decoded[`https://${process.env.URL}/roles`]
          const requiredRole = 'user'
          if (!roles || !roles.length || !roles.includes(requiredRole)) {
            console.log(`User ${decoded.sub} is not an ${requiredRole}`)
            console.log(`User ${decoded.sub} current roles:`, roles)
            return reject(`Missing role ${requiredRole}`)
          }
          /**/

          // Everything is ok!
          return resolve(decoded)
        })
      } catch (err) {
        console.log('jwt.verify exception', err)
        return reject(err)
      }
    })
  })
}
