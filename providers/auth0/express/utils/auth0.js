const jwt = require('express-jwt')
const jwksRsa = require('jwks-rsa')

/* initialize the JWKS client */
const auth0Domain = process.env.AUTH0_DOMAIN
const auth0Audience = process.env.AUTH0_AUDIENCE || 'universe-theater'
const auth0Issuer = process.env.AUTH0_ISSUER || 'https://adobot.auth0.com/'
const checkJwt = jwt({
  // Dynamically get signing key from kid header & fetch signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),
  /* Validate the audience and the issuer */
  audience: auth0Audience,
  issuer: auth0Issuer,
  algorithms: ['RS256']
})

module.exports = checkJwt
