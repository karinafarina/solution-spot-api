function makeCategoriesArray() {
  return [
    {
      id: 1,
      title: 'Homelessness',
    },
    {
      id: 2,
      title: 'Substance Addicted Births',
    },
    {
      id: 3,
      title: 'Mass Shootings',
    },
    {
      id: 4,
      title: 'Obesety Epidemic'
    },
    {
      id: 5,
      title: 'Teen Vaping'
    },
  ]
}

function makeMaliciousCategory() {
  const maliciousCategory = {
    id: 911,
    title: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  };

  const expectedCategory = {
    ...maliciousCategory,
    title: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return  {
    maliciousCategory,
    expectedCategory
  };
}

module.exports = {
  makeCategoriesArray,
  makeMaliciousCategory
}