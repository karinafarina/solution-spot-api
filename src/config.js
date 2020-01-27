module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://karinagaulin@localhost/solution-spot',
  TEST_DATABASE_URL: "postgresql://karinagaulin@localhost/solution-spot-test",
  API_BASE_URL: process.env.REACT_APP_BASE_URL || "http://localhost:8000/api",
  JWT_SECRET:   process.env.JWT_SECRET || 'change-this-secret',
}