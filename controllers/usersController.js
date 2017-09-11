const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const uuidv1 = require('uuid/v1')
const Mail = require('../utils/mail')

const minimalUserData = {
  _id: 1,
  name: 1,
  email: 1,
  privileges: 1
}

const getEmailData = (to, text) => ({ from: process.env.SMTP_USER, to, subject: 'Activate Account', text })

// CREATE
exports.newUser = async (req, res) => {
  const password = req.body.password || false
  if (!password) return res.status(400).json({ status: 'KO', message: 'Missing required param: password' })
  const name = req.body.name || false
  if (!name) return res.status(400).json({ status: 'KO', message: 'Missing required param: name' })
  const email = req.body.email || false
  if (!email) return res.status(400).json({ status: 'KO', message: 'Missing required param: email' })
  const hash = await bcrypt.hash(password.trim(), Number(process.env.BCRYPT_SALT_ROUNDS))
  const userData = {
    name,
    email,
    hash,
    activation_token: crypto.randomBytes(30).toString('hex')
  }
  // TODO: handle validation fail and check if user already exist to show message to activate acccount
  const user = new User(userData)
  await user.save()
  res.status(201).json({ status: 'OK', message: 'A new user has been created', user })
  // Send activation email:
  const emailData = getEmailData(user.email, `Go to ${process.env.DOMAIN}${process.env.APIV1}/user/activate/${user.activation_token} to activate your account :)`)
  Mail.sendMail(emailData, (err, info) => {
    if (err) return console.error(err)
    return console.log(`Activation email sent: ${info.response}`)
  })
}

// READ
exports.getUsers = async (req, res) => {
  const permissions = req.body.token.privileges
  let users
  if (Number(permissions) < 950) { // TODO: get this value from constants file
    users = await User.find().select(minimalUserData)
  } else {
    users = await User.find()
  }
  res.status(200).json({ status: 'OK', message: 'There goes your users data, sir!', users })
}

exports.getUser = async (req, res) => {
  const permissions = req.body.token.privileges
  let user
  if (Number(permissions) < 950) { // TODO: get this value from constants file
    user = await User.findOne({ _id: req.body.token.id }).select(minimalUserData)
  } else {
    user = await User.findOne({ _id: req.body.token.id })
  }
  if (!user) return res.status(404).json({ status: 'KO', message: 'Your account does not exists anymore :O' })
  res.status(200).json({ status: 'OK', message: 'There goes your user info, bro!', user })
}

// UPDATE
exports.updateUser = async (req, res) => {
  const id = req.params.id || req.body.token.id || false
  if (!id) {
    res.status(400).json({ status: 'KO', message: 'Missing user id :(' })
    return
  }
  const queryKeys = Object.keys(req.query)
  // TODO: filter fields and valid fields by privileges level
  const updates = queryKeys.reduce((result, key) => {
    result[key] = req.query[key]
    return result
  }, {})
  const user = await User.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    { new: true, runValidators: true, fields: minimalUserData } // new returns updated document instead of original one and validators check model restrictions on update. Fields selects the fields returned
  )
  if (!user) return res.status(404).json({ status: 'KO', message: 'Your user could not be updated, sorry :3' })
  res.status(200).json({ status: 'OK', message: 'Updated successfully, dude! :D', user })
}

exports.activateUser = async (req, res) => {
  if (!req.params.token || req.params.token.length === 0) {
    res.status(400).json({ status: 'KO', message: 'You need a token to activate your account :/' })
    return
  }
  const updates = { activated: true }
  const user = await User.findOneAndUpdate(
    { activation_token: req.params.token },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  )
  if (!user) {
    res.status(404).json({ status: 'KO', message: 'That does not seem a valid token :/' })
    return
  }
  res.status(200).json({ status: 'OK', message: 'You account has been activated and you can log in now :)' })
}

exports.resetPassword = async (req, res) => {
  // TODO: validate password provided
  if (!req.params.token || req.params.token.length === 0) return res.status(400).json({ status: 'KO', message: 'Missing token :S' })
  const hash = await bcrypt.hash(req.body.password.trim(), Number(process.env.BCRYPT_SALT_ROUNDS))
  const updates = {
    hash,
    reset_password_token: ''
  }
  const user = await User.findOneAndUpdate(
    {
      reset_password_token: req.params.token,
      reset_password_token_expires: { $gt: Date.now() }
    },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' } // TODO: what the hell is this?!
  )
  if (!user) return res.status(500).json({ status: 'KO', message: 'Could not update your password :S' })
  res.status(200).json({ status: 'OK', message: 'Now you can log in with your new password :D' })
}

exports.createRecoveryToken = async (req, res) => {
  const userData = req.body.email || req.body.name || false
  if (!userData) return res.status(400).json({ status: 'KO', message: 'You have to provide your username or email :S' })
  const recoveryToken = uuidv1()
  const expires = Date.now() + 6 * 60 * 60 * 1000 // 6 hours in the future
  const user = await User.findOneAndUpdate(
    { $or: [{ email: userData }, { name: userData }] },
    { $set: { reset_password_token: recoveryToken, reset_password_token_expires: expires }},
    { new: true, runValidators: true, fields: { email: 1, reset_password_token: 1 }}
  )
  res.status(200).json({ status: 'OK', message: 'We have sent an email with recovery account instructions to the email related to that account :D' }) // I don't test the updateResult because I want a response that does not depends on account existing or not
  // If account exists, send an email with the data.
  if (!user) return console.log('Someone is trying to recovery a non existing account... :/') // TODO: properly log this
  const emailData = getEmailData(user.email, `Go to ${process.env.DOMAIN}${process.env.APIV1}/user/forgoten/${user.reset_password_token} to set a new password for your account :)`)
  Mail.sendMail(emailData, (err, info) => {
    if (err) return console.error(err)
    return console.log(`Forgoten email sent: ${info.response}`)
  })
}

// DELETE
exports.deleteUser = async (req, res) => {
  const id = getUserIdFromToken(req)
  if (!id) {
    res.status(400).json({ status: 'KO', message: 'Missing user id :(' })
    return
  }
  const removed = await User.findByIdAndRemove({ _id: id })
  if (removed) return res.status(200).json({ status: 'OK', message: 'Your account has been removed :(' })
  return res.status(500).json({ status: 'KO', message: 'Your account can not be removed. Maybe it was already removed before :/' })
}

exports.deleteUsers = async (req, res) => {

}

// FUNCTIONS
const getUserIdFromToken = req => {
  if (!req) return false
  return req.params.id || req.body.token.id || false
}
