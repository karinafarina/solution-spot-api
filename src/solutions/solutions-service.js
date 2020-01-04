const SolutionsService = {
  getAllSolutions(knex) {
    return knex.select('*').from('solutions')
  },

  insertSolutions(knex, newSolution) {
    return knex
      .insert(newSolution)
      .into('solutions')
      .returning('*')
      .then(rows => {
        return rows[0]
      });
  },

  getById(knex, solutionId) {
    return knex
      .from('solutions')
      .select('*')
      //Make sure id is an integer
      .where('id', parseInt(solutionId, 10))
      .first()
  },

  deleteSolution(knex, solutionId) {
    return knex('solutions')
      //Make sure id is an integer
      .where('id', parseInt(solutionId, 10))
      .delete()
  },

  updateSolution(knex, id, newSolutionFields) {
    return knex('solutions')
      .where({ id })
      .update(newSolutionFields)
  }
}

module.exports = SolutionsService