const jwt = require('jsonwebtoken')


function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ userId: user.id }, secret, {
    subject: user.email,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}

module.exports = {
  makeAuthHeader,
}