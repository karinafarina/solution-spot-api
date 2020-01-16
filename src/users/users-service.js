const assert = require('assert');

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

  getById(knex, user_id) {
    assert(user_id, 'The id is required by getbyid')
    return knex
      .from('users')
      .select('*')
      .where('id', user_id)
      .first()
  },

  getByEmail(knex, email) {
    assert(email, 'The email is required by email')
    return knex
      .from('users')
      .select('*')
      .where('email', email)
      .first()
  },

  deleteUser(knex, user_id) {
    return knex('users')
      .where('id', parseInt(user_id, 10))
      .delete()
  },

  updateUser(knex, id, newUserFields) {
    return knex('users')
      .where({ id })
      .update(newUserFields)
  }
}

module.exports = UsersService