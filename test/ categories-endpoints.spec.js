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

    context(`Given an XSS attack folder name`, () => {
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

    describe.only('GET /api/categories/:categoryId', () => {
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
        const testCategories = makeCategoriesArray()

        beforeEach('insert categories', () => {
          return db
            .into('categories')
            .insert(testCategories)
        })

        it('responds with 200 and the specified category', () => {
          const categoryId = 2
          const expectedCategory = testCategories[categoryId - 1]
          return supertest(app)
            .get(`/api/categories/${categoryId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedCategory)
        })
      })

      context('Given an XSS attack folder', () => {
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
  })
})
