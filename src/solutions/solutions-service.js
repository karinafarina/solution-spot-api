const xss = require('xss')

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

  getCommentsForSolution(db, solutionId) {
    return db
      .from('comments AS comm')
      .select(
        'comm.id',
        'comm.content',
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.email,
                  usr."userPassword"
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .where('comm.solutionId', solutionId)
      .leftJoin(
        'users AS usr',
        'comm.userId',
        'usr.id',
      )
      .groupBy('comm.id', 'usr.id')
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
  },

  serializeSolutionComment(comment) {
    console.log('commetn', comment)
    const { user } = comment
    return {
      id: comment.id,
      solutionId: comment.solutionId,
      content: xss(comment.content),
      user: {
        id: user.id,
        email: user.email,
        userPassword: user.userPassword
      },
    }
  },
}

module.exports = SolutionsService