const bcrypt = require('bcryptjs')
const UsersService = require('../users/users-service')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''

  let basicToken
  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' })
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length)
  }

  const [tokenEmail, tokenPassword] = UsersService.parseBasicToken(basicToken)

  if (!tokenEmail || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  UsersService.getByEmail(
    req.app.get('db'),
    tokenEmail
  )
    .then(user => {
      if (!user || user.userPassword !== tokenPassword) {
        return res.status(401).json({ error: 'Unauthorized request' })
      }
      
      req.user = user
      next()
    })
    .catch(next)
}

module.exports = {
  requireAuth,
}