const nodemailer = require('nodemailer')

const password = new Buffer(process.env.SMTP_PASSWORD.toString(), 'base64') // TODO: try to put this on a config dotenv script loaded just after dotenv require, that do the custom transformations

const stmpConfig = {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: password
  }
}

const transporter = nodemailer.createTransport(stmpConfig)

module.exports = transporter
