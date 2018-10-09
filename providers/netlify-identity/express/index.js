const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compression = require('compression')
const morgan = require('morgan')
const serverless = require('serverless-http')
const customLogger = require('./utils/logger')
const netlifyCheckAuth = require('./utils/netlifyAuth')

/* initialize express */
const app = express()
const router = express.Router()

/*  gzip responses */
router.use(compression())

/* Setup protected routes */
router.get('/', netlifyCheckAuth, (req, res) => {
  res.json({
    super: 'Secret stuff here'
  })
})

/* Attach request logger for AWS */
app.use(morgan(customLogger))

/* Attach routes to express instance */
const functionName = 'express'
const routerBasePath = (process.env.NODE_ENV === 'dev') ? `/${functionName}` : `/.netlify/functions/${functionName}/`
app.use(routerBasePath, router)

/* Apply express middlewares */
router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

/* Export lambda ready express app */
exports.handler = serverless(app)
// # might need https://github.com/dougmoscrop/serverless-http#requestresponse-transforms
