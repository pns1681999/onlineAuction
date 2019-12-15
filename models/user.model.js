const db = require('../utils/db');

module.exports = {
  all: () => db.load('select * from nguoidung'),
  single: id => db.load(`select * from nguoidung where IdNguoiDung = ${id}`),
  add: entity => db.add('nguoidung', entity),
  del: id => db.del('nguoidung', { IdNguoiDung: id }),
  patch: entity => {
    const condition = { IdNguoiDung: entity.IdNguoiDung };
    delete entity.IdNguoiDung;
    return db.patch('nguoidung', entity, condition);
  },

  allOfId: id => db.load(`select * from nguoidung where ThuocDanhMuc = ${id}`) 

  // allWithDetails: _ => {
  //   const sql = `
  //     select c.CatID, c.CatName, count(p.ProID) as num_of_products
  //     from categories c left join products p on c.CatID = p.CatID
  //     group by c.CatID, c.CatName`;
  //   return db.load(sql);
  // },
};