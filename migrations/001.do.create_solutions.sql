CREATE TABLE users (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  email TEXT NOT NULL,
  "userPassword" TEXT NOT NULL
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title TEXT NOT NULL
);

CREATE TABLE solutions (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  "categoryId" INTEGER REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  modified TIMESTAMP DEFAULT now() NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  "solutionId" INTEGER REFERENCES solutions(id) ON DELETE CASCADE NOT NULL
);

