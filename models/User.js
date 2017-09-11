const mongoose = require('mongoose')
const validator = require('validator')
const mongodbErrorHandler = require('mongoose-mongodb-errors')
const md5 = require('md5')
const uuidv1 = require('uuid/v1')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'You must supply a name for the user',
    lowercase: true,
    trim: true,
    index: true,
    unique: true
  },
  email: {
    type: String,
    required: 'You must supply an email for the user',
    lowercase: true,
    trim: true,
    index: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid Email Address']
  },
  hash: {
    type: String,
    required: 'You must supply a hash for the user'
  },
  privileges: {
    type: Number,
    default: 100
  },
  activated: {
    type: Boolean,
    default: false
  },
  activation_token: {
    type: String,
    required: 'You must supply an activation code for the user'
  },
  reset_password_token: String,
  reset_password_token_expires: Date,
  date_register: {
    type: Date,
    default: Date.now
  },
  date_activation: Date,
  date_last_login: Date,
  login_fails: {
    type: Number,
    default: 0
  }
})

userSchema.pre('save', async function (next) {
  // Check if exists user with that name, email...
  this.activation_token = uuidv1()
  next()
})

userSchema.virtual('gravatar').get(function () {
  const hash = md5(this.email)
  return `https://gravatar.com/avatar/${hash}s=200`
})

userSchema.plugin(mongodbErrorHandler)

module.exports = mongoose.model('User', userSchema)
