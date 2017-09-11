const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = async (req, res) => {
  const user = await User.findOne({ $or: [{ email: req.body.username }, { name: req.body.username }] })
  if (!user) return res.status(401).json({ status: 'KO', message: 'Failed login D:' })
  const successfulLogin = await bcrypt.compare(req.body.password, user.hash)
  if (!successfulLogin) {
    // TODO: record this in logs or alert the admin
    if (user.login_fails < 10) {
      user.login_fails++
      user.save() // Don't await because we don't need the result
    }
    return res.status(401).json({ status: 'KO', message: 'Failed login D:', user: { login_fails: user.login_fails }})
  }
  // Check failed attempts
  if (user.login_fails >= 10) return res.status(403).json({ status: 'KO', message: 'Your account has been blocked due to repeated login failed attempts. It will be unlocked automatically in 24 hours. Shit happens :/' })
  // Clean failed attempts
  user.login_fails = 0
  user.save()
  if (user.activated === false) return res.status(403).json({ status: 'KO', message: 'This account is not activated yet :/' })
  const userData = {
    id: user._id,
    name: user.name,
    gravatar: user.gravatar,
    privileges: user.privileges
  }
  const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: 60 * 30, algorithm: process.env.JWT_ALGORITHM.toString() })
  res.status(200).json({ status: 'OK', message: 'Enjoy your token, dude!', token })
}

exports.isLogged = (req, res, next) => {
  // Take the token from headers, body or query string:
  const token = req.body.token || req.query.token || req.headers['x-access-token']
  if (!token) {
    res.status(400).json({ status: 'KO', message: 'Missing token in the request' }) // 400 - bad request
    return
  }
  // Validate the token:
  let validToken
  try {
    validToken = jwt.verify(token, process.env.JWT_SECRET, { maxAge: 60 * 30 * 1000, algorithm: process.env.JWT_ALGORITHM.toString() })
  } catch (e) {
    console.error(e.message)
    res.status(401).json({ status: 'KO', message: 'Token is not valid' }) // 401 - unauthorized
    return
  }
  req.body.token = validToken
  next()
}

exports.isAdmin = (req, res, next) => {
  // Read permissions from token:
  const permissions = req.body.token.privileges
  // Compare with admin value from constants file ?
  if (Number(permissions) < 900) { // TODO: take this value from a constants file
    res.status(403).json({ status: 'KO', message: 'Forbidden access to this resource. It seems you don\'t have enough privileges, dude :/' })
    return
  }
  next()
}
