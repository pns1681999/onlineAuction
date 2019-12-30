const db = require('../utils/db');
const config = require('../config/default.json');

module.exports = {
  all: () => db.load('select * from sanpham '),
  allInIdArray: (array, offset) => db.load(`select * from sanpham where IdSanPham in (${array.join(',' )}) limit ${config.paginate.limit} OFFSET ${offset}`),
  allByCat: catId => db.load(`  SELECT * FROM sanpham WHERE LoaiSanPham = ${catId}
                                UNION
                                SELECT * FROM sanpham WHERE LoaiSanPham in (SELECT IdDanhMuc FROM danhmuc WHERE ThuocDanhMuc = ${catId})`),
  countByCat: async catId => {
    const rows = await db.load(`SELECT count(*) as total FROM (SELECT * FROM sanpham WHERE LoaiSanPham = ${catId}
                                UNION
                                SELECT * FROM sanpham WHERE LoaiSanPham in (SELECT IdDanhMuc FROM danhmuc WHERE ThuocDanhMuc = ${catId})) c`)
    return rows[0].total;
  },
  pageByCat: (catId, offset) => db.load(`SELECT * FROM (SELECT * FROM sanpham WHERE LoaiSanPham = ${catId}
                                        UNION
                                        SELECT * FROM sanpham WHERE LoaiSanPham in (SELECT IdDanhMuc FROM danhmuc WHERE ThuocDanhMuc = ${catId})
                                        ) c limit ${config.paginate.limit} OFFSET ${offset}`),

  single: id => db.load(`select * from sanpham where IdSanPham = ${id}`),
  singleWithDatetime: datetime => db.load(`select * from sanpham where NgayDang = '${datetime}'`),
  add: entity => db.add('sanpham', entity),
  del: id => db.del('sanpham', { IdSanPham: id }),
  patch: entity => {
    const condition = { IdSanPham: entity.IdSanPham };
    delete entity.IdSanPham;
    return db.patch('sanpham', entity, condition);
  },
  topNearExpiry: () => db.load(`SELECT * FROM sanpham WHERE NgayHetHan > SYSDATE() ORDER BY  datediff(CURRENT_DATE, NgayHetHan) DESC limit ${config.gettop.limit}`),
  topMostBids: () => db.load(`SELECT * FROM sanpham WHERE NgayHetHan > SYSDATE() ORDER BY  SoLuotRaGia DESC limit ${config.gettop.limit}`),
  topHighBid: () => db.load(`SELECT * FROM sanpham WHERE NgayHetHan > SYSDATE() ORDER BY GiaHienTai DESC limit ${config.gettop.limit}`)
};
