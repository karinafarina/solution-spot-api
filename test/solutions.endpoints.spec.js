const knex = require('knex');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures.js');
const { makeCommentsArray, makeMaliciousComment } = require('./comments.fixtures.js');
const { makeSolutionsArray, seedUsers, makeExpectedSolutionComments, makeMaliciousSolution } = require('./solutions.fixtures.js');
const { makeCategoriesArray } = require('./categories.fixtures');
const { makeAuthHeader } = require('./test-helpers')

describe('Solutions Endpoints', function() {
  let db;

  const testUsers = makeUsersArray();
  const testSolutions = makeSolutionsArray()
  const testCategories = makeCategoriesArray();
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
  describe('GET /api/solutions', () => {
    context('Given no solutions', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/solutions')
          .expect(200, [])
      })
    })

    context('Given there are solutions', () => {
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
      const { maliciousSolution, expectedSolution } = makeMaliciousSolution()

      beforeEach('insert malicious solution', () => {
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
      beforeEach(() => {
        seedUsers(db, testUsers)
      })
      it('responds with 404', () => {
        const solutionId = 123456
        return supertest(app)
          .get(`/api/solutions/${solutionId}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Solution Not Found` } })
      })
    })

    context('Given there are solutions in database', () => {

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

      it('responds with 200 and the specified solution', () => {
        const solutionId = 2
        const expectedSolution = testSolutions[solutionId - 1]
        return supertest(app)
          .get(`/api/solutions/${solutionId}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200, expectedSolution)
      })
    })

    context('Given an XSS attack solution', () => {
      const { maliciousSolution, expectedSolution } = makeMaliciousSolution()

      beforeEach('insert malicious solution', () => {
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
                  .insert(maliciousSolution)
              })
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/solutions/${maliciousSolution.id}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body.categoryId).to.eql(expectedSolution.categoryId)
            expect(res.body.userId).to.eql(expectedSolution.userId)
            expect(res.body.content).to.eql(expectedSolution.content)
          })
      })
    })
  })

  describe('GET /api/solutions/:solutionId/comments', () => {
    context('Given no solutions', () => {
      beforeEach(() =>
        db.into('users').insert(testUsers)
      )

      it('responds with 404', () => {
        const solutionId = 123456;
        return supertest(app)
          .get(`/api/solutions/${solutionId}/comments`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(404, { error: {
            "message": "Solution Not Found"
          }
        })
      })
    })

    context('Given there are comments for solution', () => {
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
                  .then(() => {
                    return db
                      .into('comments')
                      .insert(testComments);
                  });
              });
          });
      })
      it('responds with 200 and the specified comments', () => {
        const solutionId = 1;
        const expectedComments = makeExpectedSolutionComments(testUsers, solutionId, testComments)
        return supertest(app)
          .get(`/api/solutions/${solutionId}/comments`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200, expectedComments)
      })
    })

    // context(`Given an XSS attack comment`, () => {
    //   const { maliciousComment, expectedComment } = makeMaliciousComment()

    //   beforeEach('insert malicious comment', () => {
    //     return db
    //       .into('categories')
    //       .insert(testCategories)
    //       .then(() => {
    //         return db
    //           .into('users')
    //           .insert(testUsers)
    //           .then(() => {
    //             return db
    //               .into('solutions')
    //               .insert(testSolutions)
    //               .then(() => {
    //                 return db
    //                   .into('comments')
    //                   .insert(maliciousComment);
    //               });
    //           });
    //       });
    //   })

    //   it('removes XSS attack comment', () => {
    //     return supertest(app)
    //       .get(`/api/${solutionId}/comments`)
    //       .set('Authorization', makeAuthHeader(testUsers[0]))
    //       .expect(200)
    //       .expect(res => {
    //         expect(res.body[0].solutionId).to.eql(expectedComment.solutionId)
    //         expect(res.body[0].userId).to.eql(expectedComment.userId)
    //         expect(res.body[0].content).to.eql(expectedComment.content)
    //       })
    //   })
    // })
  })

  describe('POST /api/solutions', () => {

    beforeEach('insert related category', () => {
      return db
        .into('categories')
        .insert(testCategories)
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
            .set('Authorization', makeAuthHeader(testUsers[0]))
            .expect(res.body)
        )
    })

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
   
    context('Given there are solutions in the database', () => {

      beforeEach('insert solution', () => {
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
                  .insert(testSolutions);
              })
          })
      })    

      it('responds with 204 and removes the solution', () => {
        const idToRemove = 2
        const expectedSolution = testSolutions.filter(solution => solution.id !== idToRemove)
        return supertest(app)
          .delete(`/api/solutions/${idToRemove}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/solutions`)
              .set('Authorization', makeAuthHeader(testUsers[0]))
              .expect(expectedSolution)
          )
          .catch(error => console.log(error))
      })
    })
  })
  //MAY ADD TO FUTURE VERSION
  // describe(`PATCH /api/solutions/:solutionId`, () => {
  //   context(`Given no solutions`, () => {
  //     it(`responds with 404`, () => {
  //       const solutionId = 123456
  //       return supertest(app)
  //         .delete(`/api/solutions/${solutionId}`)
  //         .set('Authorization', makeAuthHeader(testUsers[0]))
  //         .expect(404, { error: { message: `Solution Not Found` } })
  //     })
  //   })

  //   context('Given there are solutions in the database', () => {
      
  //     beforeEach('insert solutions', () => {
  //       return db
  //         .into('categories')
  //         .insert(testCategories)
  //         .then(() => {
  //           return db
  //             .into('users')
  //             .insert(testUsers)
  //             .then(() => {
  //               return db
  //                 .into('solutions')
  //                 .insert(testSolutions);
  //             })
  //         })
  //     })

  //     it('responds with 204 and updates the solution', () => {
  //       const idToUpdate = 2
  //       const updateSolution = {
  //         categoryId: 4,
  //         userId: 1,
  //         content: 'test content'
  //       }
  //       const expectedSolution = {
  //         ...testSolutions[idToUpdate - 1],
  //         ...updateSolution
  //       }
  //       return supertest(app)
  //         .patch(`/api/solutions/${idToUpdate}`)
  //         .send(updateSolution)
  //         .set('Authorization', makeAuthHeader(testUsers[0]))
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/solutions/${idToUpdate}`)
  //             .set('Authorization', makeAuthHeader(testUsers[0]))
  //             .expect(expectedSolution)
  //         )
  //     })

  //     it(`responds with 400 when no required fields supplied`, () => {
  //       const idToUpdate = 2
  //       return supertest(app)
  //         .patch(`/api/solutions/${idToUpdate}`)
  //         .send({ irrelevantField: 'foo' })
  //         .set('Authorization', makeAuthHeader(testUsers[0]))
  //         .expect(400, {
  //           error: {
  //             message: `Request body must contain 'categoryId', 'userId', 'content'`
  //           }
  //         })
  //     })

  //     it(`responds with 204 when updating only a subset of fields`, () => {
  //       const idToUpdate = 2
  //       const updateSolution = {
  //         content: 'Updated content',
  //       }
  //       const expectedSolution = {
  //         ...testSolutions[idToUpdate - 1],
  //         ...updateSolution
  //       }

  //       return supertest(app)
  //         .patch(`/api/solutions/${idToUpdate}`)
  //         .send({
  //           ...updateSolution,
  //           fieldToIgnore: 'should not be in GET response'
  //         })
  //         .set('Authorization', makeAuthHeader(testUsers[0]))
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/solutions/${idToUpdate}`)
  //             .expect(expectedSolution)
  //         )
  //     })
  //   })
  // })
})