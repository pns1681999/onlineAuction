db=require("../utils/db");
const config = require('../config/default.json');

module.exports={
    single:id=> db.load(`select * from wishlist where IdNguoiDung=${id} and NgayHetHan > SYSDATE() `),
    add: entity=> db.add("wishlist",entity),
    del:id=>db.load("wishlist",{IdSanPham:id}),
    patch:entity=>{const condition = { IdSanPham: entity.IdSanPham };
    delete entity.IdSanPham;
    return db.patch('wishlist', entity, condition);},
    countWatchedByBidder: async bidderId => {
        const rows = await db.load(`SELECT count(*) as total FROM ( SELECT * FROM wishlist WHERE IdNguoiDung = ${bidderId} and NgayHetHan > SYSDATE() )c`)
        return rows[0].total;
      },
    pageWatchedByBidder: (bidderId, offset) => db.load(`SELECT * FROM (SELECT * FROM wishlist WHERE IdNguoiDung = ${bidderId} and NgayHetHan > SYSDATE()) c limit ${config.paginate.limit} OFFSET ${offset}`),
}