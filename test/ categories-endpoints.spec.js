const knex = require('knex');
const app = require('../src/app');
const { makeCategoriesArray, makeMaliciousCategory } = require('./categories.fixtures.js');

describe('Category Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.desroy())

  before('clean the table', () => 
    db.raw('TRUNCATE ')
  )
})
