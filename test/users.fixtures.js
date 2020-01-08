function makeUsersArray() {
  return [
    {
      id: 1,
      userName: "Fred Streeby",
      email: "fredstreeby@gmail.com",
      userPassword: "12345"
    },
    {
      id: 2,
      userName: "Matt Brady",
      email: "matbrady@gmail.com",
      userPassword: "67889"
    }
  ]
}

function makeMaliciousUser() {
  const maliciousUser = {
    id: 911,
    userName: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    email: 'bademail@gmail.com',
    userPassword: "Badpassword"
  };

  const expectedUser = {
    ...maliciousUser,
    userName: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
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