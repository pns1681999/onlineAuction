db=require("../utils/db");
const config = require('../config/default.json');

module.exports={
    single:id=> db.load(`select * from wishlist where IdNguoiDung=${id}`),
    add: entity=> db.add("wishlist",entity),
    countWatchedByBidder: async bidderId => {
        const rows = await db.load(`SELECT count(*) as total FROM ( SELECT * FROM wishlist WHERE IdNguoiDung = ${bidderId} )c`)
        return rows[0].total;
      },
    pageWatchedByBidder: (bidderId, offset) => db.load(`SELECT * FROM (SELECT * FROM wishlist WHERE IdNguoiDung = ${bidderId} ) c limit ${config.paginate.limit} OFFSET ${offset}`),
}