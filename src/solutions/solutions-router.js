const path = require('path');
const express = require('express');
const { requireAuth } = require('../middleware/jwt-auth')
const xss = require('xss');

const SolutionsService = require('./solutions-service');

const solutionsRouter = express.Router();
const jsonParser = express.json();

const serializeSolution = solution => ({
  id: solution.id,
  categoryId: solution.categoryId,
  userId: solution.userId,
  content: xss(solution.content),
  modified: solution.modified
})

solutionsRouter
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
    const { categoryId, userId, content } = req.body
    const newSolution = { categoryId, userId, content }

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
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${solution.id}`))
          .json(serializeSolution(solution))
      })
      .catch(next)
  })

solutionsRouter
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
        res.status(201).json({
          message: true
        })
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { categoryId, userId, content } = req.body
    const solutionToUpdate = { categoryId, userId, content }

    const numberOfValues = Object.values(solutionToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'categoryId', 'userId', 'content'`
        }
      })
    SolutionsService.updateSolution(
      req.app.get('db'),
      req.params.solutionId,
      solutionToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

  solutionsRouter
    .route('/:solutionId/comments')
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
    .get((req, res, next) => {
      SolutionsService.getCommentsForSolution(
        req.app.get('db'),
        req.params.solutionId
      )
      .then(comments => {
        res.json(comments.map(SolutionsService.serializeSolutionComment))
      })
      .catch(next)
    })

module.exports = solutionsRouter;