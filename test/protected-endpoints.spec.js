const knex = require('knex')
const app = require('../src/app')
const jwt = require('jsonwebtoken')
const { makeUsersArray } = require('./users.fixtures.js');
const { makeCategoriesArray } = require('./categories.fixtures')
const { makeCommentsArray } = require('./comments.fixtures.js');
const { makeSolutionsArray } = require('./solutions.fixtures.js');
const { makeAuthHeader, makeInvalidAuthHeader } = require('./test-helpers')

describe('Protected endpoints', function () {
  let db

  const testCategories = makeCategoriesArray();
  const testUsers = makeUsersArray();
  const testUser = testUsers[0]
  const testSolutions = makeSolutionsArray()
  const testComments = makeCommentsArray();


  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () =>
    db.raw('TRUNCATE solutions, categories, users, comments RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () =>
    db.raw('TRUNCATE solutions, categories, users, comments RESTART IDENTITY CASCADE')
  )

  beforeEach('insert comment', () => {
        return db
          .into('categories')
          .insert(testCategories)
          .then(() => {
            return db
              .into('users')
              .insert(testUsers)
              .then(() => {
                return db
                  .into('solutions')
                  .insert(testSolutions)
                  .then(() => {
                    return db
                      .into('comments')
                      .insert(testComments);
                  });
              });
          });
        });

  const protectedEndpoints = [
    {
      name: 'GET /api/solutions/:solutionId',
      path: '/api/solutions/1',
      method: supertest(app).get,
    },
    {
      name: 'GET /api/solutions/:solutionId/comments',
      path: '/api/solutions/1/comments',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/comments',
      path: '/api/comments',
      method: supertest(app).post,
    },
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token` })
      })

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('Authorization', makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: `Unauthorized request` })
      })

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const invalidUser = { userEmail: 'user-not-existy', id: 1 }
        return endpoint.method(endpoint.path)
          .set('Authorization', makeInvalidAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` })
      })
    })
  })
})