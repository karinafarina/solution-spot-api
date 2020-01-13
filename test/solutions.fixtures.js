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
  makeMaliciousSolution
}