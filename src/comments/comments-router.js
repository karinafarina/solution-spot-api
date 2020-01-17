const path = require('path')
const express = require('express')
const xss = require('xss')
const CommentsService = require('./comments-service')

const commentsRouter = express.Router();
const jsonParser = express.json();

const serializeComment = comment => ({
  id: comment.id,
  userId: comment.userId,
  content: xss(comment.content),
  solutionId: comment.solutionId
})
//get comments by solutionId
commentsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    CommentsService.getAllComments(knexInstance)
      .then(comments => {
        res.json(comments.map(serializeComment))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { userId, content, solutionId } = req.body
    const newComment = { userId, content, solutionId }

    for(const [key, value] of Object.entries(newComment))
      if(value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    CommentsService.insertComment(
      req.app.get('db'),
      newComment
    )
      .then(comment => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${comment.id}`))
          .json(serializeComment(comment))
      })
      .catch(next)
  })

commentsRouter
  .route('/:commentId')
  .all((req, res, next) => {
    const { commentId } = req.params;
    const knexInstance = req.app.get('db')
    CommentsService.getById(knexInstance, commentId)
      .then(comment => {
        if (!comment) {
          return res.status(404).json({
            error: { message: `Comment doesn't exist` }
          });
        }
        res.comment = comment
        next()
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeComment(res.comment))
  })
  .delete((req, res, next) => {
    const { commentId } = req.params
    const knexInstance = req.app.get('db');
    CommentsService.deleteComment(knexInstance, commentId)
      .then(numRowsAffected => {
        res.status(204).json({
          message: true
        })
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { content } = req.body
    const commentToUpdate = { content }
    const numberOfValues = Object.values(commentToUpdate).filter(Boolean).length
    if (numberOfValues === 0) 
      return res.status(400).json({
        error: {
          message: `Request body must contain 'content'`
        }
      })

    CommentsService.updateComment(
      req.app.get('db'),
      req.params.commentId,
      commentToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
    })

module.exports = commentsRouter;
