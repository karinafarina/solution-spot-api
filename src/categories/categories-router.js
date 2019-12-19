const path = require('path');
const express = require('express');
const xss = require('xss');

const CategoryService = require('./categories-service');

const categoryRouter = express.Router();
const jsonParser = express.json();

const serializeCategory = category => ({
  id: category.id,
  title: xss(category.title),
})

categoryRouter
//route needs to match client route
  .route('/')
  .get((req, res, next) => {
    CategoryService.getAllCategories(req.app.get('db'))
      .then(categories => {
        res.json(categories.map(serializeCategory))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    const { title } = req.body
    const newCategory = { title }
    
    for(const [key, value] of Object.entries(newCategory))
    if(value == null)
      return res.status(400).json({
        error: { message: `Missing '${key}' in request body`}
      })

    CategoryService.insertCategory(
      req.app.get('db'),
      newCategory
    )
    .then(category => {
      console.log('req.originalUrl', req.originalUrl)
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${category.id}`))
        .json(serializeCategory(category))
    })
    .catch(next)
  })

categoryRouter
  .route('/:categoryId')
  .all((req, res, next) => {
    const { categoryId } = req.params
    const knexInstance = req.app.get('db')
    CategoryService.getById(knexInstance, categoryId)
      .then(category => {
        if(!category) {
          return res.status(404).json({
            error: { message: `Category Not Found`}
          })
        }
        res.category = category
        next()
      })
      .catch(next)
  }) 
  .get((req, res, next) => {
    res.json(serializeCategory(res.category))
  })

  module.exports = categoryRouter;