const knex = require('knex')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { makeUsersArray } = require('./users.fixtures.js');

describe.only('Auth Endpoints', function () {
  let db

  const testUsers = makeUsersArray()
  const testUser = testUsers[0]
  
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () =>
    db.raw('TRUNCATE users, categories, solutions, comments RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () =>
    db.raw('TRUNCATE users, categories, solutions, comments RESTART IDENTITY CASCADE')
  )

  describe(`POST /api/auth/login`, () => {
    beforeEach('insert user', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    const requiredFields = ['email', 'userPassword']
      requiredFields.forEach(field => {
        const loginAttemptBody = {
          email: testUser.email,
          userPassword: testUser.userPassword,
        }
          it(`responds with 400 required error when '${field}' is missing`, () => {
            delete loginAttemptBody[field]
          
            return supertest(app)
              .post('/api/auth/login')
              .send(loginAttemptBody)
              .expect(400, {
                error: `Missing '${field}' in request body`,
              })
          })
      })

    it(`responds 400 'invalid email or password' when bad email`, () => {
      const userInvalidUser = { email: 'user-not', userPassword: 'existy' }
        return supertest(app)
          .post('/api/auth/login')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(userInvalidUser)
          .expect(400, { error: `Incorrect email or password` })
    })

    it(`responds 400 'invalid email or password' when bad password`, () => {
      const userInvalidPass = { email: testUser.email, userPassword: 'incorrect' }
        return supertest(app)
          .post('/api/auth/login')
          .send(userInvalidPass)
          .expect(400, { error: `Incorrect email or password` })
    })
    
    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const userValidCreds = {
        email: testUser.email,
        userPassword: testUser.password,
      }
      const expectedToken = jwt.sign(
        { userId: testUser.id }, //payload
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          algorithm: 'HS256',
        }
      )
      
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken,
        })
        // .then(res => {
        //   supertest(app)
        //     .post('/api/auth/login')
        //     .send({ email:newUser.email, userPassword: newUser.userPassword })
        //     .expect(200)
        // })
    })
  })
})