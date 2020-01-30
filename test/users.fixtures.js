const bcrypt = require('bcryptjs')

function makeUsersArray() {
  return [
    {
      id: 1,
      email: "fredstreeby@gmail.com",
      "userPassword": "12345"
    },
    {
      id: 2,
      email: "matbrady@gmail.com",
      "userPassword": "67889"
    }
  ]
}

function makeMaliciousUser() {
  const maliciousUser = {
    id: 911,
    email: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    "userPassword": "Badpassword"
  };

  const expectedUser = {
    ...maliciousUser,
    email: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousUser,
    expectedUser
  };
}

module.exports = {
  makeUsersArray,
  makeMaliciousUser
}