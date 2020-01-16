TRUNCATE
  users 
  RESTART IDENTITY CASCADE;

INSERT INTO users ("userName", email, "userPassword")
VALUES
  ('Fred Streeby', 'fredstreeby@gmail.com', '$2a$12$c6gysEYuyGXuvzn2FcXU5.d0odmevSrEErNzY1JxpYJL1NgIntBjC'),
  ('Matt Brady', 'maty@gmail.com', '$2a$12$sO0RyDbjU/YQ0gPOy1mFOuNZpniT46r/L7hlN/YetNwnxOBwAtiii');