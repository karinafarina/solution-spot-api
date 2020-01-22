const knex = require('knex');
const app = require('../src/app');
const { makeCommentsArray, makeMaliciousComment } = require('./comments.fixtures.js');
const { makeCategoriesArray } = require('./categories.fixtures')
const { makeUsersArray } = require('./users.fixtures');
const { makeSolutionsArray } = require('./solutions.fixtures')

describe('Comments Endpoints', function () {
  let db;

  const testCategories = makeCategoriesArray();
  const testUsers = makeUsersArray();
  const testComments = makeCommentsArray()
  const testSolutions = makeSolutionsArray()


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
  
  describe('POST /api/comments', () => {
    beforeEach('insert related solution', () => {
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

//NOT PASSING
    it('creates a comment, reponding with 201 and the new comment', () => {
      this.retries(3);
      const testSolution = testSolutions[0];
      const testUser = testUsers[0];
      const newComment = {
        solutionId: testSolution.id,
        content: 'test new comment'
      }

      return supertest(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newComment)
        .expect(201)
        .expect(res => {
          console.log('resbody', res.body, newComment)
          expect(res.body.solutionId).to.eql(newComment.solutionId)
          expect(res.body.user.id).to.eql(testUser.id)
          expect(res.body.content).to.eql(newComment.content)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/comments/${res.body.id}`)
        })
        .expect(res => {
          console.log('resss', res)
          return db  
            .from('comments')
            .select('*')
            .where({ id: res.body.id })
            .first()
            .then(row => {
              console.log('row', row)
              expect(row.content).to.eql(newComment.content)
              expect(row.solutionId).to.eql(newComment.solutionId)
              expect(row.userId).to.eql(testUser.id)
            })
        })
    })

    const requiredFields = ['solutionId', 'content'];

    requiredFields.forEach(field => {
      const testSolution = testSolutions[0]
      const testUser = testUsers[0]
      const newComment = {
        solutionId: testSolution.id,
        content: 'test content'
      }
      //NOT PASSING, UNAUTHORIZED, WHY????
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newComment[field]

        return supertest(app)
          .post('/api/comments')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newComment)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousComment, expectedComment } = makeMaliciousComment()
      return supertest(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(maliciousComment)
        .expect(201)
        .expect(res => {
          expect(res.body.solutionId).to.eql(expectedComment.solutionId);
          expect(res.body.userId).to.eql(expectedComment.userId)
          expect(res.body.content).to.eql(expectedComment.content)
        });
    });
  })

  // describe(`DELETE /api/comments/:commentId`, () => {
  //   context(`Given no comment`, () => {
  //     it(`responds with 404`, () => {
  //       const commentId = 123456;
  //       return supertest(app)
  //         .delete(`/api/comments/${commentId}`)
  //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //         .expect(404, { error: { message: `Comment doesn't exist` } })
  //     })
  //   })
  //   context('Given there are comments in the database', () => {
  //     const testUsers = makeUsersArray();
  //     const testCategories = makeCategoriesArray();
  //     const testSolutions = makeSolutionsArray();
  //     const testComments = makeCommentsArray();

  //     beforeEach('insert comment', () => {
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
  //                 .insert(testSolutions)
  //                 .then(() => {
  //                   return db
  //                     .into('comments')
  //                     .insert(testComments);
  //                 });
  //             });
  //         });
  //     })

  //     it('responds with 204 and removes the comment', () => {
  //       const idToRemove = 2;
  //       const expectedComment = testComments.filter(comment => comment.id !== idToRemove)
  //       return supertest(app)
  //         .delete(`/api/comments/${idToRemove}`)
  //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //         .expect(204)
  //         .then(res => {
  //           supertest(app)
  //             .get(`/api/comments`)
  //             .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //             .expect(expectedComment)
  //         }) 
  //         .catch(error => {
  //           console.log(error)
  //           throw error;
  //         })
  //     })
  //   })
  // })

  // describe(`PATCH /api/comments/:commentId`, () => {
  //   context(`Given no comments`, () => {
  //     it(`responds with 404`, () => {
  //       const commentId = 123456
  //       return supertest(app)
  //         .delete(`/api/comments/${commentId}`)
  //         .expect(404, { error: { message: `Comment doesn't exist` } })
  //     })
  //   })

  //   context('Given there are comments in the database', () => {
  //     const testComments = makeCommentsArray()
  //     const testSolutions = makeSolutionsArray();
  //     const testCategories = makeCategoriesArray();
  //     const testUsers = makeUsersArray();

  //     beforeEach('insert comments', () => {
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
  //                 .insert(testSolutions)
  //                 .then(() => {
  //                   return db
  //                     .into('comments')
  //                     .insert(testComments);
  //                 });
  //             });
  //         });
  //     })

  //     it('responds with 204 and updates the comment', () => {
  //       const idToUpdate = 2
  //       const updateComment = {
  //         content: 'updated content'
  //       }
  //       const expectedComment = {
  //         ...testComments[idToUpdate - 1],
  //         ...updateComment
  //       }
        
  //       return supertest(app)
  //         .patch(`/api/comments/${idToUpdate}`)
  //         .send(updateComment)
  //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //         .expect(204)
  //         .then(res => {
            
  //           supertest(app)
            
  //             .get(`/api/comments/${idToUpdate}`)
  //             .expect(expectedComment)
  //         })
  //         .catch(error => {console.log('error', error)})
  //     })

  //     it(`responds with 400 when no required fields supplied`, () => {
  //       const idToUpdate = 2
  //       return supertest(app)
  //         .patch(`/api/comments/${idToUpdate}`)
  //         .send({ irrelevantField: 'foo' })
  //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //         .expect(400, {
  //           error: {
  //             message: `Request body must contain 'content'`
  //           }
  //         })
  //     })

  //     it(`responds with 204 when updating only a subset of fields`, () => {
  //       const idToUpdate = 2
  //       const updateComment = {
  //         content: 'Updated content',
  //       }
  //       const expectedComment = {
  //         ...testComments[idToUpdate - 1],
  //         ...updateComment
  //       }

  //       return supertest(app)
  //         .patch(`/api/comments/${idToUpdate}`)
  //         .send({
  //           ...updateComment,
  //           fieldToIgnore: 'should not be in GET response'
  //         })
  //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/comments/${idToUpdate}`)
  //             .expect(expectedComment)
  //         )
  //     })
  //   })
  // })
})