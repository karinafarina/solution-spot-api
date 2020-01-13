const knex = require('knex');
const app = require('../src/app');
const { makeCommentsArray, makeMaliciousComment } = require('./comments.fixtures.js');
const { makeCategoriesArray } = require('./categories.fixtures')
const { makeUsersArray } = require('./users.fixtures');
const { makeSolutionsArray } = require('./solutions.fixtures')

describe('Comments Endpoints', function () {
  let db;

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

  describe('GET /api/comments', () => {
    context('Given no comments', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/comments')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })
  
    context('Given there are comments', () => {
      const testCategories = makeCategoriesArray();
      const testUsers = makeUsersArray();
      const testComments = makeCommentsArray()
      const testSolutions = makeSolutionsArray()
      
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
      })
      it('responds with 200 and all of the comments', () => {
        return supertest(app)
          .get('/api/comments')
          .expect(res => {
            testComments.length === res.body.length;
          })
      })
    })

    context(`Given an XSS attack comment`, () => {
      const { maliciousComment, expectedComment } = makeMaliciousComment()
      const testSolutions = makeSolutionsArray();
      const testCategories = makeCategoriesArray();
      const testUsers = makeUsersArray();

      beforeEach('insert malicious comment', () => {
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
                      .insert(maliciousComment);
                  });
              });
          });
      })

      it('removes XSS attack comment', () => {
        return supertest(app)
          .get(`/api/comments`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].solutionId).to.eql(expectedComment.solutionId)
            expect(res.body[0].userId).to.eql(expectedComment.userId)
            expect(res.body[0].content).to.eql(expectedComment.content)
          })
      })
    })
  })

  describe('GET /api/comments/:commentId', () => {
    context('Given no comments', () => {
      it('responds with 404', () => {
        const commentId = 123456
        return supertest(app)
          .get(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Comment doesn't exist` } })
      })
    })

    context('Given there are comments in database', () => {
      const testCategories = makeCategoriesArray();
      const testUsers = makeUsersArray();
      const testComments = makeCommentsArray();
      const testSolutions = makeSolutionsArray();
      

      beforeEach('insert comments', () => {
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

      it('responds with 200 and the specified comment', () => {
        const commentId = 2
        const expectedComment = testComments[commentId - 1]
        return supertest(app)
          .get(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(res => {
            expectedComment.length === res.body.length
          })
      })
    })

    context('Given an XSS attack comment', () => {
      const testSolutions = makeSolutionsArray();
      const { maliciousComment, expectedComment } = makeMaliciousComment();
      const testCategories = makeCategoriesArray();
      const testUsers = makeUsersArray();

      beforeEach('insert malicious comment', () => {
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
                      .insert(maliciousComment);
                  });
              });
          });
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/comments/${maliciousComment.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.solutionId).to.eql(expectedComment.solutionId)
            expect(res.body.userId).to.eql(expectedComment.userId)
            expect(res.body.content).to.eql(expectedComment.content)
          })
      })
    })
  })
  
  describe('POST /api/comments', () => {
    const testSolutions = makeSolutionsArray();
    const testCategories = makeCategoriesArray();
    const testUsers = makeUsersArray();

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

    it('creates a comment, reponding with 201 and the new comment', () => {
      const newComment = {
        solutionId: 1,
        userId: 1,
        content: 'test content'
      }

      return supertest(app)
        .post('/api/comments')
        .send(newComment)
        .expect(201)
        .expect(res => {
          expect(res.body.solutionId).to.eql(newComment.solutionId)
          expect(res.body.userId).to.eql(newComment.userId)
          expect(res.body.content).to.eql(newComment.content)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/comments/${res.body.id}`)
          // const expectedDate = new Date().toLocaleDateString()
          // const actualDate = new Date(res.body.modified).toLocaleDateString()
          // expect(actualDate).to.eql(expectedDate)
        })
        .then(res =>
          supertest(app)
            .get(`/api/comments/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['solutionId', 'userId', 'content'];

    requiredFields.forEach(field => {
      const newComment = {
        solutionId: 1,
        userId: 1,
        content: 'test content'
      }
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newComment[field]

        return supertest(app)
          .post('/api/comments')
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
        .send(maliciousComment)
        .expect(201)
        .expect(res => {
          expect(res.body.solutionId).to.eql(expectedComment.solutionId);
          expect(res.body.userId).to.eql(expectedComment.userId)
          expect(res.body.content).to.eql(expectedComment.content)
        });
    });
  })

  describe(`DELETE /api/comments/:commentId`, () => {
    context(`Given no comment`, () => {
      it(`responds with 404`, () => {
        const commentId = 123456;
        return supertest(app)
          .delete(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Comment doesn't exist` } })
      })
    })
    context('Given there are comments in the database', () => {
      const testUsers = makeUsersArray();
      const testCategories = makeCategoriesArray();
      const testSolutions = makeSolutionsArray();
      const testComments = makeCommentsArray();

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
      })

      it('responds with 204 and removes the comment', () => {
        const idToRemove = 2;
        const expectedComment = testComments.filter(comment => comment.id !== idToRemove)
        return supertest(app)
          .delete(`/api/comments/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/comments`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedComment)
          }) 
          .catch(error => {
            console.log(error)
            throw error;
          })
      })
    })
  })

  describe(`PATCH /api/comments/:commentId`, () => {
    context(`Given no comments`, () => {
      it(`responds with 404`, () => {
        const commentId = 123456
        return supertest(app)
          .delete(`/api/comments/${commentId}`)
          .expect(404, { error: { message: `Comment doesn't exist` } })
      })
    })

    context('Given there are comments in the database', () => {
      const testComments = makeCommentsArray()
      const testSolutions = makeSolutionsArray();
      const testCategories = makeCategoriesArray();
      const testUsers = makeUsersArray();

      beforeEach('insert comments', () => {
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

      it('responds with 204 and updates the comment', () => {
        const idToUpdate = 2
        const updateComment = {
          content: 'updated content'
        }
        const expectedComment = {
          ...testComments[idToUpdate - 1],
          ...updateComment
        }
        
        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
          .send(updateComment)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => {
            
            supertest(app)
            
              .get(`/api/comments/${idToUpdate}`)
              .expect(expectedComment)
          })
          .catch(error => {console.log('error', error)})
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: `Request body must contain 'content'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateComment = {
          content: 'Updated content',
        }
        const expectedComment = {
          ...testComments[idToUpdate - 1],
          ...updateComment
        }

        return supertest(app)
          .patch(`/api/comments/${idToUpdate}`)
          .send({
            ...updateComment,
            fieldToIgnore: 'should not be in GET response'
          })
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/comments/${idToUpdate}`)
              .expect(expectedComment)
          )
      })
    })
  })
})