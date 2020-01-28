const path = require('path');
const express = require('express');
const xss = require('xss');
const bcrypt = require('bcryptjs');

const UsersService = require('./users-service');

const userRouter = express.Router();
const jsonParser = express.json();


const serializeUser = user => ({
  id: user.id,
  email: xss(user.email)
})

userRouter
//route to match client route
  .route('/')
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get('db'))
      .then(users => {
        res.json(users.map(serializeUser))
      })
  })

  //HASH PASSWORD FROM USER REGISTRATION
  .post(jsonParser, (req, res, next) => {
    const { email, userPassword } = req.body;
    const newUser = { email, userPassword };

    for(const [key, value] of Object.entries(newUser))
    if(value == null)
      return res.status(400).json({
        error: { message: `Missing '${key}' in request body` }
      })
    
     UsersService.hashPassword(newUser.userPassword)
      .then((hashedPassword) => {
        const newUser = {
          email,
          userPassword: hashedPassword,
        }
        return UsersService.insertUser(
                req.app.get('db'),
                newUser
              )
              .then(user => {
                res
                  .status(201)
                  .location(path.posix.join(req.originalUrl, `/${user.id}`))
                  .json(serializeUser(user))
              })   
            })
            
            .catch(next) 
          })
  

  userRouter
    .route('/:userId')
    .all((req, res, next) => {
      const { userId } = req.params;
      const knexInstance = req.app.get('db')
      UsersService.getById(knexInstance, userId)
        .then(user => {
          if(!user) {
            return res.status(404).json({
              error: { message: `User Not Found`}
            });
          }
          res.user = user
          next()
        })
        .catch(next)
    })
    .get((req, res) => {
      res.json(serializeUser(res.user))
    })
    .delete((req, res, next) => {
      const { userId } = req.params;
      const knexInstance = req.app.get('db');
      UsersService.deleteUser(knexInstance, userId)
        .then(numRowsAffected => {
          res.status(204).json({
            message: true
          })
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
      const { email, userPassword } = req.body;
      const userToUpdate = { email, userPassword };
      
      const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
      if(numberOfValues === 0)
        return res.status(400).json({
          error: {
            message: `Request body must contain 'email', 'userPassword'`
          }
        })
      UsersService.updateUser(
        req.app.get('db'),
        req.params.userId,
        userToUpdate,
      )
        .then(numRowsAffected => {
          res.status(204).end()
        })
        .catch(next)
    })


  module.exports = userRouter