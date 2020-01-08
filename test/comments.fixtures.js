function makeCommentsArray() {
  return [
    {
      id: 1,
      userId: 2,
      content: "Crazy idea!",
      solutionId: 1
    },
    {
      id: 2,
      userId: 1,
      content: "Lovely!",
      solutionId: 3
    }
  ]
}

function makeMaliciousComment() {
  const maliciousComment = {
    id: 911,
    userId: 1,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    solutionId: 1
  };

  const expectedComment = {
    ...maliciousComment,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousComment,
    expectedComment
  };
}

module.exports = {
  makeCommentsArray,
  makeMaliciousComment
}