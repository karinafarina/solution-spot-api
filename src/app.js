require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const winston = require('winston');
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config');
// const solutionsRouter = require('./solutions/solution-router');

const app = express()

const morganOption = (NODE_ENV === 'production')
  ?'tiny'
  : 'common';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

// app.use('/api/solutions', solutionsRouter)

app.get('/', (req, res) => {
  res.send('Hello, world!');
  res.json({ ok: true });
})

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next()
})

app.use(function errorHandler(error, req, res, next) {
  let response 
  if(NODE_ENV === 'production') {
    response = { error: { message: 'server error ' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app
