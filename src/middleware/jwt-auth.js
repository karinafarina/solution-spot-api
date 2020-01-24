const UserService = require('../users/users-service')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''

  let bearerToken
  if(!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  } else {
    bearerToken = authToken.slice(7, authToken.length)
  }
  try {
    const payload = UserService.verifyJwt(bearerToken)

    UserService.getByEmail(
      req.app.get('db'),
      payload.sub,
    )
      .then(user => {
        if(!user)
          return res.status(401).json({ error: 'Unauthorized request' })
        req.user = user
        next()
      })
  } catch(error) {
    res.status(401).json({ error: 'Unauthorized request' })
  }
}

module.exports = {
  requireAuth,
}