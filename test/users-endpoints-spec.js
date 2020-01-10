const knex = require('knex');
const app = require('../src/app');
const { makeUsersArray, makeMaliciousUser } = require('./users.fixtures.js');


describe('Users Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnenct from db', () => db.destroy())

  beforeEach('clean the table', () => 
    db.raw('TRUNCATE users RESTART IDENTITY CASCADE')
  )

  describe('GET api/users', () => {
    context('Given no users', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are users in database', () => {
      const testUsers = makeUsersArray();
      
      beforeEach('insert user', () => {
        return db
          .into('users')
          .insert(testUsers)
      })

      it('responds with 200 and all of the users', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200, testUsers)
      }) 
    })

    context(`Given an XSS attack user`, () => {
      const { maliciousUser, expectedUser } = makeMaliciousUser();
      
      beforeEach('insert malicous userName', () => {
        return db
          .into('users')
          .insert(maliciousUser)
      })

      it('removes XSS attack userName', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200)
          .expect(res => {
            expect(res.body[0].userName).to.eql(expectedUser.userName)
          })
      })
    })
  })

  describe('GET /api/users/:userId', () => {
    context('Given no users', () => {
      it('responds with 404', () => {
        const userId = 123456;
        return supertest(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `User Not Found`} })
      })
    })

    context('Given an XSS attack userName', () => {
       const testUser = makeUsersArray();
       const { maliciousUser, expectedUser } = makeMaliciousUser();

       beforeEach('insert malicious user', () => {
         return db  
          .into('users')
          .insert( [maliciousUser])
       })

       it('removes XSS attack content', () => {
         return supertest(app)
          .get(`/api/users/${maliciousUser.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.userName).to.eql(expectedUser.userName)
          })
       })
    })
  })

  describe('POST /api/users', () => {

    it('creates a user, responding with 201 and the new user', () => {
      const newUser = {
        userName: 'New user',
        email: 'new@gmail.com',
        userPassword: 'newpassord',
      }
      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect(res => {
          expect(res.body.userName).to.eql(newUser.userName)
          expect(res.body.email).to.eql(newUser.email)
          expect(res.body.userPassword).equal(newUser.userPassword)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
        })
        .then(res => 
          supertest(app)
            .get(`/api/users/${res.body.id}`)
            .expect(res.body)
          )
      })

      const requiredFields = ['userName', 'email', 'userPassword']
      requiredFields.forEach(field => {
        const newUser = {
          userName: 'Test username',
          email: 'test email',
          userPassword: 'test password'
        }
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newUser[field]

        return supertest(app)
          .post('/api/users')
          .send(newUser)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousUser, expectedUser } = makeMaliciousUser();
      return supertest(app)
        .post('/api/users')
        .send(maliciousUser)
        .expect(201)
        .expect(res => {
          console.log('response', res.body.userPassword, expectedUser.userPassword)
          expect(res.body.userName).to.eql(expectedUser.userName);
          expect(res.body.email).to.eql(expectedUser.email);
          expect(res.body.userPassword).to.eql(expectedUser.userPassword);
        });
    });
  })

  describe(`DELETE /api/users/:userId`, () => {
    context(`Given no users`, () => {
      it(`responds with 404`, () => {
        const userId = 123456;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `User Not Found` } })
      })
    })
    context('Given there are users in the database', () => {
      const testUsers = makeUsersArray();

      beforeEach('insert user', () => {
        return db
          .into('users')
          .insert(testUsers);
      })

      it('responds with 204 and removes the user', () => {
        const idToRemove = 2;
        const expectedUser = testUsers.filter(user => user.id !== idToRemove);
        return supertest(app)
          .delete(`/api/users/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/users`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedUser)
          )
          .catch(error => console.log(error))
      })
    })
  })

  describe(`PATCH /api/users/:userId`, () => {
    
    context(`Given no users`, () => {
      it(`responds with 404`, () => {
        const userId = 123456;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .expect(404, { error: { message: `User Not Found` } })
      })
    })

    context(`Given there are users in database`, () => {
      const testUser = makeUsersArray();
      
      beforeEach('insert user', () => {
        return db
          .into('users')
          .insert(testUser)
      })

      it('responds with 204 and updates the user', () => {
        const idToUpdate = 2;
        
        const updateUser = {
          userName: 'Update name',
          email: 'update email',
          userPassword: 'update password'
        }
        const expectedUser = {
          ...testUser[idToUpdate -1],
          ...updateUser
        }
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send(updateUser)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
              supertest(app)
              .get(`/api/users/${idToUpdate}`)
              .expect(expectedUser)
            )
        })

      it(`responds with 400 when no required fields supplies`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: `Request body must contain 'userName', 'email', 'userPassword'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateUser = {
          userName: 'updated name',
          email: 'updated email',
          userPassword: 'updatd password'
        }
        const expectedUser = {
          ...testUser[idToUpdate - 1],
          ...updateUser
        }

        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .send({
            ...updateUser,
            fieldToIgnore: 'should not be in GET response'
          })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => 
              supertest(app)
                .get(`/api/users/${idToUpdate}`)
                .expect(expectedUser)
            )
      })
    })
  })
})