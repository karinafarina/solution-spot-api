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
      //Ask Jeremy about .where
      .where('id', parseInt(categoryId, 10))
      .first()
  },

  deleteCategory(knex, categoryId) {
    console.log('categoryid', categoryId)
    return knex('categories')
      .where({ categoryId })
      .delete()
  },

  updateCategory(knex, id, newCategoryFields) {
    return knex('categories')
      .where({ id })
      .update(newCategoryFields)
  }
}

module.exports = CategoryService