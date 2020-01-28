const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
      userPassword: bcrypt.hashSync(user.userPassword, 1)
    }))
      return db.into('users').insert(preppedUsers)
        .then(() =>
         // update the auto sequence to stay in sync
          db.raw(
             `SELECT setval('sers_id_seq', ?)`,[users[users.length - 1].id],
           )
        )
  }

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