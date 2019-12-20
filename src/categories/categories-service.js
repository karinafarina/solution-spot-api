const CategoryService = {
  getAllCategories(knex) {
    return knex.select('*').from('categories')
  },

  insertCategory(knex, newCategory) {
    return knex
      .insert(newCategory)
      .into('categories')
      .returning('*')
      .then(rows => {
        console.log('category rows', rows)
        return rows[0]
      });
  },

  getById(knex, categoryId) {
    return knex
      .from('categories')
      .select('*')
      //Make sure id is an integer
      .where('id', parseInt(categoryId, 10))
      .first()
  },

  deleteCategory(knex, categoryId) {
    return knex('categories')
      //Make sure id is an integer
      .where('id', parseInt(categoryId, 10))
      .delete()
  },

  updateCategory(knex, id, newCategoryFields) {
    return knex('categories')
      .where({ id })
      .update(newCategoryFields)
  }
}

module.exports = CategoryService