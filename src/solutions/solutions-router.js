const path = require('path');
const express = require('express');
const xss = require('xss');

const SolutionsService = require('./solutions-service');

const solutionRouter = express.Router();
const jsonParser = express.json();

const serializeSolution = solution => ({
  id: solution.id,
  categoryId: solution.categoryId,
  userId: solution.userId,
  content: xss(solution.content),
  modified: solution.modified
})

solutionRouter
  //route needs to match client route
  .route('/')
  .get((req, res, next) => {
    SolutionsService.getAllSolutions(req.app.get('db'))
      .then(solutions => {
        res.json(solutions.map(serializeSolution))
      })

      .catch(next)
  })


  .post(jsonParser, (req, res, next) => {
    const { categoryId, userName, content } = req.body
    const newSolution = { categoryId, userName, content }

    for (const [key, value] of Object.entries(newSolution))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    SolutionsService.insertSolutions(
      req.app.get('db'),
      newSolution
    )
      .then(solution => {
        console.log('req.originalUrl', req.originalUrl)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${solution.id}`))
          .json(serializeSolution(solution))
      })
      .catch(next)
  })

solutionRouter
  .route('/:solutionId')
  .all((req, res, next) => {
    const { solutionId } = req.params;
    const knexInstance = req.app.get('db')
    SolutionsService.getById(knexInstance, solutionId)
      .then(solution => {
        if (!solution) {
          return res.status(404).json({
            error: { message: `Solution Not Found` }
          });
        }
        res.solution = solution
        next()
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeSolution(res.solution))
  })
  .delete((req, res, next) => {
    const { solutionId } = req.params
    const knexInstance = req.app.get('db');
    SolutionsService.deleteSolution(knexInstance, solutionId)
      .then(numRowsAffected => {
        res.status(204).json({
          message: true
        })
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { categoryId, userName, content } = req.body
    const solutionToUpdate = { categoryId, userName, content }

    const numberOfValues = Object.values(solutionToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'categoryId', 'userName', 'content'`
        }
      })
    SolutionsService.updateSolution(
      req.app.get('db'),
      req.params.solutionId,
      solutionToUpdate
    )
      .then(numRowsAffected => {
        console.log('numrows', numRowsAffected)
        res.status(204).end()
      })
      .catch(next)
  })




module.exports = solutionRouter;