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
    const { categoryId } = req.params;
    const knexInstance = req.app.get('db')
    CategoryService.getById(knexInstance, categoryId)
      .then(category => {
        if(!category) {
          return res.status(404).json({
            error: { message: `Category Not Found`}
          });
        }
        res.category = category
        next()
      })
      .catch(next);
  }) 
  .get((req, res) => {
    res.json(serializeCategory(res.category))
  })
  .delete((req, res, next) => {
    const { categoryId } = req.params
    const knexInstance = req.app.get('db');
    CategoryService.deleteCategory(knexInstance, categoryId)
      .then(nemRowsAffected => {
        res.status(204).json({
          message: true
        })
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title } = req.body
    const categoryToUpdate = { title }

    const numberOfValues = Object.values(categoryToUpdate).filter(Boolean).length
    if(numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'title'`
        }
      })
      CategoryService.updateCategory(
        req.app.get('db'),
        req.params.categoryId,
        categoryToUpdate
      )
      .then(numRowsAffected => {
        console.log('numrows', numRowsAffected)
        res.status(204).end()
      })
      .catch(next)
  })

  
  

  module.exports = categoryRouter;