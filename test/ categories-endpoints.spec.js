const knex = require('knex');
const app = require('../src/app');
const { makeCategoriesArray, makeMaliciousCategory } = require('./categories.fixtures.js');

describe('Category Endpoints', function() {
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
    db.raw('TRUNCATE solutions, categories RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () => 
    db.raw('TRUNCATE solutions, categories RESTART IDENTITY CASCADE')
  )

  describe('GET /api/categories', () => {
    context('Given no categories', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/categories')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are categories', () => {
      const testCategory = makeCategoriesArray()

      beforeEach('insert categories', () => {
        return db
          .into('categories')
          .insert(testCategory)
      })
      it('responds with 200 and all of the categories', () => {
        return supertest(app)
          .get('/api/categories')
          .expect(200, testCategory)
      })
    })

    context(`Given an XSS attack category name`, () => {
      const { maliciousCategory, expectedCategory } = makeMaliciousCategory()

      beforeEach('insert malicious category name', () => {
        return db
          .into('categories')
          .insert(maliciousCategory)
      })

      it('removes XSS attack category name', () => {
        return supertest(app)
          .get(`/api/categories`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedCategory.title)
          })
      })
    })

    describe('GET /api/categories/:categoryId', () => {
      context('Given no categories', () => {
        it('responds with 404', () => {
          const categoryId = 123456
          return supertest(app)
            .get(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, { error: { message: `Category Not Found`} })
        })
      })

      context('Given there are categories in database', () => {
        const testCategory = makeCategoriesArray()

        beforeEach('insert categories', () => {
          return db
            .into('categories')
            .insert(testCategory)
        })

        it('responds with 200 and the specified category', () => {
          const categoryId = 2
          const expectedCategory = testCategory[categoryId - 1]
          return supertest(app)
            .get(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedCategory)
        })
      })

      context('Given an XSS attack category', () => {
        const testCategory = makeCategoriesArray()
        const { maliciousCategory, expectedCategory } = makeMaliciousCategory()

        beforeEach('insert malicious category', () => {
          return db
            .into('categories')
            .insert([maliciousCategory])
        })

        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/api/categories/${maliciousCategory.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql(expectedCategory.title)
            })
        })
      })
    })
    describe('POST /api/categories', () => {
      const testCategory = makeCategoriesArray()

      it('creates a category, reponding with 201 and the new category', () => {
        const newCategory = {
          title: 'Test New Category'
        }
        return supertest(app)
          .post('/api/categories')
          .send(newCategory)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newCategory.title)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`/api/categories/${res.body.id}`)
          })
          .then(res => 
            supertest(app)
              .get(`/api/categories/${res.body.id}`)
              .expect(res.body)
            )
      }) 
      //Ask Jeremy
      const requiredFields = ['title']

      requiredFields.forEach(field => {
        const newCategory = {
          title: 'Test New Category'
        }
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newCategory[field]

        return supertest(app)
          .post('/api/categories')
          .send(newCategory)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
        })
      })
      it('removes XSS attack content from response', () => {
        const { maliciousCategory, expectedCategory } = makeMaliciousCategory()
        return supertest(app)
          .post('/api/categories')
          .send(maliciousCategory)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedCategory.title);
          });
      });
    })

    describe(`DELETE /api/categories/:categoryId`, () => {
      context(`Given no category`, () => {
        it(`responds with 404`, () => {
          const categoryId = 123456;
          return supertest(app)
            .delete(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, { error: { message: `Category Not Found` } })
        })
      })
      context('Given there are categories in the database', () => {
        const testCategory = makeCategoriesArray();

        beforeEach('insert category', () => {
          return db
            .into('categories')
            .insert(testCategory);
        })

        it('responds with 204 and removes the category', () => {
          const idToRemove = 2
          const expectedCategory = testCategory.filter(category => category.id !== idToRemove)
          return supertest(app)
            .delete(`/api/categories/${idToRemove}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(res =>
                supertest(app)
                  .get(`/api/categories`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(expectedCategory)
            )
            .catch(error => console.log(error))
        })
      })
    })
    describe.only(`PATCH /api/categories/:categorId`, () => {
      context(`Given no categories`, () => {
        it(`responds with 404`, () => {
          const categoryId = 123456
          return supertest(app)
            .delete(`/api/categories/${categoryId}`)
            .expect(404, { error: { message: `Category Not Found` } })
        })
      })

      context('Given there are categories in the database', () => {
        const testCategory = makeCategoriesArray()

        beforeEach('insert categories', () => {
          return db
            .into('categories')
            .insert(testCategory)
        })

        it('responds with 204 and updates the category', () => {
          const idToUpdate = 2
          const updateCategory = {
            title: 'updated category title',
          }
          const expectedCategory = {
            ...testCategory[idToUpdate - 1],
            ...updateCategory
          }
          return supertest(app)
            .patch(`/api/categories/${idToUpdate}`)
            .send(updateCategory)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/categories/${idToUpdate}`)
                .expect(expectedCategory)
            )
        })

        it(`responds with 400 when no required fields supplied`, () => {
          const idToUpdate = 2
          return supertest(app)
            .patch(`/api/categories/${idToUpdate}`)
            .send({ irrelevantField: 'foo' })
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: {
                message: `Request body must contain 'title'`
              }
            })
        })

        it(`responds with 204 when updating only a subset of fields`, () => {
          const idToUpdate = 2
          const updateCategory = {
            title: 'updated category title',
          }
          const expectedCategory = {
            ...testCategory[idToUpdate - 1],
            ...updateCategory
          }

          return supertest(app)
            .patch(`/api/categories/${idToUpdate}`)
            .send({
              ...updateCategory,
              fieldToIgnore: 'should not be in GET response'
            })
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/categories/${idToUpdate}`)
                .expect(expectedCategory)
            )
        })
      })
    })

  })
})
