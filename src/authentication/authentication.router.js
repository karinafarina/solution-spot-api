const express = require('express');
//const xss = require('xss');
const bcrypt = require('bcryptjs');
const UsersService = require('../users/users-service');

const authenticationRouter = express.Router();
const jsonParser = express.json();

authenticationRouter
  //route to match client route
  .route('/login')

  .post(jsonParser, (req, res, next) => {
    const { email, userPassword } = req.body;
    const loginUser = { email, userPassword }
    for (const [key, value] of Object.entries(loginUser))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })
    UsersService.getByEmail(
      req.app.get('db'),
      loginUser.email
    )
      .then(user => {
        console.log('user', user, loginUser.email)
        if(!user) {
          return res.status(400).json({ 
            error: 'Incorrect email or password'
          })
        }
          
          return UsersService.comparePasswords(loginUser.userPassword, user.userPassword)
            .then(compareMatch => {
              console.log('made it', compareMatch)

              if(!compareMatch)
                return res.status(400).json({
                  error: 'Incorrect email or password',
                })

              const sub = user.email
              const payload = { userId: user.id }
              res.send({
                authToken: UsersService.createJwt(sub, payload),
                userId: user.id
              })
            })
        })
        .catch(next)
      })
      
      



module.exports = authenticationRouter;