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

  const [tokenUserName, tokenPassword] = UsersService.parseBasicToken(basicToken)

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  UsersService.getByEmail(
    req.app.get('db'),
    tokenUserName
  )
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' })
      }

      //return bcrypt.compare(tokenPassword, user.password)
      return UsersService.comparePasswords(tokenPassword, user.userPassword)
        .then(passwordsMatch => {
          if (!passwordsMatch) {
            return res.status(401).json({ error: 'Unauthorized request' })
          }

          req.user = user
          next()
        })
    })
    .catch(next)
}

module.exports = {
  requireAuth,
}