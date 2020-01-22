TRUNCATE
  users 
  RESTART IDENTITY CASCADE;

INSERT INTO users (email, "userPassword")
VALUES
  ('fredstreeby@gmail.com', '$2a$12$c6gysEYuyGXuvzn2FcXU5.d0odmevSrEErNzY1JxpYJL1NgIntBjC'),
  ('maty@gmail.com', '$2a$12$sO0RyDbjU/YQ0gPOy1mFOuNZpniT46r/L7hlN/YetNwnxOBwAtiii');