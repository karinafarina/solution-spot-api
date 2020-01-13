const knex = require('knex');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures.js');
const { makeSolutionsArray, makeMaliciousSolution } = require('./solutions.fixtures.js');
const { makeCategoriesArray } = require('./categories.fixtures');
// const { makeCommentsArray } = require('./comments.fixtures');


describe('Solutions Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
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
  describe('GET /api/solutions', () => {
    context('Given no solutions', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/solutions')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are solutions', () => {
      const testUsers = makeUsersArray();
      const testSolutions = makeSolutionsArray()
      const testCategories = makeCategoriesArray();
      //const testComments = makeCommentsArray();
      beforeEach('insert solutions', () => {
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
              })
          })
      })
      it('responds with 200 and all of the solutions', () => {
        return supertest(app)
          .get('/api/solutions')
          .expect(200, testSolutions)
      })
    })

    context(`Given an XSS attack solution`, () => {
      const testUser = makeUsersArray()
      const { maliciousSolution, expectedSolution } = makeMaliciousSolution()
      const testCategory = makeCategoriesArray();
      // const testComments = makeCommentsArray();

      beforeEach('insert malicious solution', () => {
        return db
          .into('categories')
          .insert(testCategory)
          .then(() => {
            return db
              .into('users')
              .insert(testUser)
              .then(() => {
                return db
                .into('solutions')
                .insert(maliciousSolution)
              })
          })
      })
    
      it('removes XSS attack solution', () => {
        return supertest(app)
          .get(`/api/solutions`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].categoryId).to.eql(expectedSolution.categoryId)
            expect(res.body[0].userId).to.eql(expectedSolution.userId)
            expect(res.body[0].modified).to.eql(expectedSolution.modified)
            expect(res.body[0].content).to.eql(expectedSolution.content)
          })
      })
    })
  })

  describe('GET /api/solutions/:solutionId', () => {
    context('Given no solutions', () => {
      it('responds with 404', () => {
        const solutionId = 123456
        return supertest(app)
          .get(`/api/solutions/${solutionId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Solution Not Found` } })
      })
    })

    context('Given there are solutions in database', () => {
      const testUsers = makeUsersArray();
      const testCategory = makeCategoriesArray();
      const testSolution = makeSolutionsArray()

      beforeEach('insert solutions', () => {
        return db
          .into('categories')
          .insert(testCategory)
          .then(() => {
            return db
              .into('users')
              .insert(testUsers)
              .then(() => {
                return db
                .into('solutions')
                .insert(testSolution)
              })
            })
      })

      it('responds with 200 and the specified solution', () => {
        const solutionId = 2
        const expectedSolution = testSolution[solutionId - 1]
        return supertest(app)
          .get(`/api/solutions/${solutionId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedSolution)
      })
    })

    context('Given an XSS attack solution', () => {
      const testUsers = makeUsersArray();
      const testCategory = makeCategoriesArray();
      // const testSolution = makeSolutionsArray()
      const { maliciousSolution, expectedSolution } = makeMaliciousSolution()

      beforeEach('insert malicious solution', () => {
        return db
          .into('categories')
          .insert(testCategory)
          .then(() => {
            return db
              .into('users')
              .insert(testUsers)
              .then(() => {
                return db
                  .into('solutions')
                  .insert(maliciousSolution)
              })
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/solutions/${maliciousSolution.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.categoryId).to.eql(expectedSolution.categoryId)
            expect(res.body.userId).to.eql(expectedSolution.userId)
            expect(res.body.content).to.eql(expectedSolution.content)
          })
      })
    })
  })

  describe('POST /api/solutions', () => {
    const testUsers = makeUsersArray();
    const testCategory = makeCategoriesArray();

    beforeEach('insert related category', () => {
      return db
        .into('categories')
        .insert(testCategory)
        .then(() => {
          return db
            .into('users')
            .insert(testUsers)
        })
    })

    it('creates a solution, reponding with 201 and the new solution', () => {
      const newSolution = {
        categoryId: 4,
        userId: 1,
        content: 'test content'
      }

      return supertest(app)
        .post('/api/solutions')
        .send(newSolution)
        .expect(201)
        .expect(res => {
          expect(res.body.categoryId).to.eql(newSolution.categoryId)
          expect(res.body.userId).to.eql(newSolution.userId)
          expect(res.body.content).to.eql(newSolution.content)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/solutions/${res.body.id}`)
          const expectedDate = new Date().toLocaleDateString()
          const actualDate = new Date(res.body.modified).toLocaleDateString()
          expect(actualDate).to.eql(expectedDate)
        })
        .then(res =>
          supertest(app)
            .get(`/api/solutions/${res.body.id}`)
            .expect(res.body)
        )
    })

    //Ask Jeremy
    const requiredFields = ['categoryId', 'userId', 'content'];

    requiredFields.forEach(field => {
      const newSolution = {
        categoryId: 4,
        userId: 1,
        content: 'test content'
      }
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newSolution[field]

        return supertest(app)
          .post('/api/solutions')
          .send(newSolution)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousSolution, expectedSolution } = makeMaliciousSolution()
      return supertest(app)
        .post('/api/solutions')
        .send(maliciousSolution)
        .expect(201)
        .expect(res => {
          expect(res.body.categoryId).to.eql(expectedSolution.categoryId);
          expect(res.body.userId).to.eql(expectedSolution.userId)
          expect(res.body.content).to.eql(expectedSolution.content)
        });
    });
  })

  describe(`DELETE /api/solutions/:solutionId`, () => {
    context(`Given no solution`, () => {
      it(`responds with 404`, () => {
        const solutionId = 123456;
        return supertest(app)
          .delete(`/api/solutions/${solutionId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Solution Not Found` } })
      })
    })
    context('Given there are solutions in the database', () => {
      const testUsers = makeUsersArray();
      const testSolution = makeSolutionsArray();
      const testCategory = makeCategoriesArray()

      beforeEach('insert solution', () => {
        return db
          .into('categories')
          .insert(testCategory)
          .then(() => {
            return db
              .into('users')
              .insert(testUsers)
              .then(() => {
                return db
                  .into('solutions')
                  .insert(testSolution);
              })
          })
      })    

      it('responds with 204 and removes the solution', () => {
        const idToRemove = 2
        const expectedSolution = testSolution.filter(solution => solution.id !== idToRemove)
        return supertest(app)
          .delete(`/api/solutions/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/solutions`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedSolution)
          )
          .catch(error => console.log(error))
      })
    })
  })
  
  describe(`PATCH /api/solutions/:solutionId`, () => {
    context(`Given no solutions`, () => {
      it(`responds with 404`, () => {
        const solutionId = 123456
        return supertest(app)
          .delete(`/api/solutions/${solutionId}`)
          .expect(404, { error: { message: `Solution Not Found` } })
      })
    })

    context('Given there are solutions in the database', () => {
      const testUsers = makeUsersArray();
      const testSolution = makeSolutionsArray()
      const testCategory = makeCategoriesArray()
      beforeEach('insert solutions', () => {
        return db
          .into('categories')
          .insert(testCategory)
          .then(() => {
            return db
              .into('users')
              .insert(testUsers)
              .then(() => {
                return db
                  .into('solutions')
                  .insert(testSolution);
              })
          })
      })

      it('responds with 204 and updates the solution', () => {
        const idToUpdate = 2
        const updateSolution = {
          categoryId: 4,
          userId: 1,
          content: 'test content'
        }
        const expectedSolution = {
          ...testSolution[idToUpdate - 1],
          ...updateSolution
        }
        return supertest(app)
          .patch(`/api/solutions/${idToUpdate}`)
          .send(updateSolution)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/solutions/${idToUpdate}`)
              .expect(expectedSolution)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/solutions/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: `Request body must contain 'categoryId', 'userId', 'content'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateSolution = {
          content: 'Updated content',
        }
        const expectedSolution = {
          ...testSolution[idToUpdate - 1],
          ...updateSolution
        }

        return supertest(app)
          .patch(`/api/solutions/${idToUpdate}`)
          .send({
            ...updateSolution,
            fieldToIgnore: 'should not be in GET response'
          })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/solutions/${idToUpdate}`)
              .expect(expectedSolution)
          )
      })
    })
  })
})