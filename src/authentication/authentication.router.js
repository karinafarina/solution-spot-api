const path = require('path');
const express = require('express');
const xss = require('xss');

const bcrypt = require('bcryptjs');
const UsersService = require('../users/users-service');

const authenticationRouter = express.Router();
const jsonParser = express.json();

//JWT
const serializeUser = user => ({
  id: user.id,
  userName: xss(user.userName),
  email: xss(user.email),
  //drop userpassword
  userPassword: xss(user.userPassword)
})

authenticationRouter
  //route to match client route
  .route('/')

  .post(jsonParser, (req, res, next) => {
    const { email, userPassword } = req.body;

    UsersService.getByEmail(
      req.app.get('db'),
      email
    )
      .then(user => {
        if(!user) {
          return res.status(401).json({ error: 'Unauthorized Request' })
        }

        return bcrypt.compare(tokenPassword, user.userPassword)
          .then(passwordsMatch => {
            if(!passwordsMatch) {
              return res.status(401).json({ error: 'Unauthorized Request' })
            }

            req.user = user
            next()
          })
      })
      .catch(next)
  })

// userRouter
//   .route('/:user_id')
//   .all((req, res, next) => {
//     const { user_id } = req.params;
//     const knexInstance = req.app.get('db')
//     UsersService.getById(knexInstance, user_id)
//       .then(user => {
//         if (!user) {
//           return res.status(404).json({
//             error: { message: `User Not Found` }
//           });
//         }
//         res.user = user
//         next()
//       })
//       .catch(next)
//   })
//   .get((req, res) => {
//     res.json(serializeUser(res.user))
//   })
//   .delete((req, res, next) => {
//     const { user_id } = req.params;
//     const knexInstance = req.app.get('db');
//     UsersService.deleteUser(knexInstance, user_id)
//       .then(numRowsAffected => {
//         res.status(204).json({
//           message: true
//         })
//       })
//       .catch(next)
//   })
//   .patch(jsonParser, (req, res, next) => {
//     const { userName, email, userPassword } = req.body;
//     const userToUpdate = { userName, email, userPassword };

//     const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
//     if (numberOfValues === 0)
//       return res.status(400).json({
//         error: {
//           message: `Request body must contain 'userName', 'email', 'userPassword'`
//         }
//       })
//     UsersService.updateUser(
//       req.app.get('db'),
//       req.params.user_id,
//       userToUpdate,
//     )
//       .then(numRowsAffected => {
//         res.status(204).end()
//       })
//       .catch(next)
//   })


module.exports = authenticationRouter;