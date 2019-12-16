const categoryModel = require('../models/category.model');

module.exports = function (app) {
  app.use(async (req, res, next) => {
    const rows0 = await categoryModel.allOfId(0);
    const rowsAll = await categoryModel.all();
    let rows = [];

    // for (const c of rows0) {
    //   rows[c.IdDanhMuc] = await categoryModel.allOfId(c.IdDanhMuc);
    // }
    rows[0] = rows0;
    rows[1] = rowsAll
    
    
    res.locals.lcCategories = rows;
    next();
  })
};

// module.exports = async (req, res, next) => {
//   const rows = await categoryModel.allWithDetails();
//   res.locals.lcCategories = rows;
//   next();
// }

