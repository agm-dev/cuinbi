// Requires:
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const expressValidator = require('express-validator')
const routes = require('./routes/index')
const errorHandlers = require('./utils/errorHandlers')

// App:
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())

// Log requests with morgan:
app.use(morgan('dev'))

app.use('/', routes)

app.use(errorHandlers.notFound)

if (process.env.ENVIRONMENT === 'development') {
  app.use(errorHandlers.developmentErrors)
}

app.use(errorHandlers.productionErrors)

module.exports = app
