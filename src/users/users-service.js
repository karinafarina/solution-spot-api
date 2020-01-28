//const assert = require('assert');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')

const UsersService = {
  getAllUsers(knex) {
    return knex.select('*').from('users')
  },

  insertUser(knex, newUser) {
    return knex
      .insert(newUser)
      .into('users')
      .returning('*')
      .then(rows => {
        return rows[0]
      });
  },

  getById(knex, userId) {
    return knex
      .from('users')
      .select('*')
      .where('id', userId)
      .first()
  },

  getByEmail(knex, email) {
    return knex
      .from('users')
      .select('*')
      .where({ email })
      .first()
  },

  comparePasswords(userPassword, hash) {
    return bcrypt.compare(userPassword, hash)
  },

  hashPassword(userPassword) {
    return bcrypt.hash(userPassword, 12)
  },

  createJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      algorithm: 'HS256',
    })
  },

  verifyJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    })
  },

  deleteUser(knex, userId) {
    return knex('users')
      .where('id', parseInt(userId, 10))
      .delete()
  },

  updateUser(knex, id, newUserFields) {
    return knex('users')
      .where({ id })
      .update(newUserFields)
  }
}

module.exports = UsersService