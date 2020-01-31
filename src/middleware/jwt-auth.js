const UserService = require('../users/users-service')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''
  let bearerToken
  if(!authToken.toLowerCase().startsWith('bearer ')) {
    console.log('auth', authToken)
    console.log('check', !authToken.toLowerCase().startsWith('Bearer '))
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
        if(!user) {
          console.log('line 21')
          return res.status(401).json({ error: 'Unauthorized request' })
        }
        req.user = user
        next()
      })
      .catch(err => {
        console.log(err)
        next(err)
      })
  } catch(error) {
    console.log('line 32')
    res.status(401).json({ error: 'Unauthorized request' })
  }
}

module.exports = {
  requireAuth,
}