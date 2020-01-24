const bcrypt = require('bcryptjs')

function makeSolutionsArray() {
  return [
    {
      id: 1,
      "userId": 1,
      "categoryId": 3,
      modified: "2019-01-03T05:00:00.000Z",
      content: "I think we should make people take a test similar to a driving test to operate a leathal weapon. "
    },
    {
      id: 2,
      "userId": 2,
      "categoryId": 2,
      modified: "2019-02-03T05:00:00.000Z",
      content: "In order to lower the rate of babies that are born addicted to drugs and alchohol, those not ready for children could be offered a monthly monetery incentive to have some form of birth control. This would also cut down on welfare costs."
    },
    {
      id: 3,
      "userId": 1,
      "categoryId": 1,
      modified: "2019-02-03T05:00:00.000Z",
      content: "We could build dormitories where people could live and it could have a cafeteria. We should ake mental health housing accessable again. We could decriminalize drug use and offer free rehab."
    },
  ]
}

function makeExpectedSolutionComments(users, solutionId, comments) {
  const expectedComments = comments
    .filter(comment => comment.solutionId === solutionId)
  console.log('expect', expectedComments)
  return expectedComments.map(comment => {
    const commentUser = users.find(user => user.id === comment.userId);
    return {
      id: comment.id,
      content: comment.content,
      user: {
        id: commentUser.id,
        email: commentUser.email,
        userPassword: commentUser.userPassword,
      }
    }
  })
}

function seedUsers(db, users) {
  const prepeppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('users').insert(preppedUsers)
    .then(() =>
      //update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function seedSolutionsTables(db, users, solutions, comments = []) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users)
    await trx.into('solutions').insert(solutions)
    // update the auto sequence to match the forced id values
    await trx.raw(
      `SELECT setval('solutions_id_seq', ?)`,
      [solutions[solutions.length - 1].id],
    )
    // only insert comments if there are some, also update the sequence counter
    if (comments.length) {
      await trx.into('comments').insert(comments)
      await trx.raw(
        `SELECT setval('comments_id_seq', ?)`,
        [comments[comments.length - 1].id],
      )
    }
  })
}


function makeMaliciousSolution() {
  const maliciousSolution = {
    id: 911,
    userId: 1,
    categoryId: 1,
    modified: "2019-02-03T05:00:00.000Z",
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  };

  const expectedSolution = {
    ...maliciousSolution,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousSolution,
    expectedSolution
  };
}

module.exports = {
  makeSolutionsArray,
  makeExpectedSolutionComments,
  seedSolutionsTables,
  makeMaliciousSolution
}