 module.exports = function (app) {
    app.use('/', require('../routes/home.route'));
    app.use('/categories', require('../routes/category.route'));
//   app.use('/admin/categories', require('../routes/admin/category.route'));
 };

