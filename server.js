// Requires:
const mongoose = require('mongoose')
require('dotenv').config()

// Connect to our MongoDB Database:
mongoose.connect(process.env.DATABASE)
mongoose.Promise = global.Promise // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', err => {
  console.error(`mongoose connection: ${err.message}`)
})

// Import models:
require('./models/User')

// Start this app:
const app = require('./app')
app.set('port', process.env.PORT || 8000)
const server = app.listen(app.get('port'), () => {
  console.log(`App running on port ${server.address().port}`)
})

module.exports = app
