db=require("../utils/db");

module.exports={
    single:id=> db.load(`select * from daugia where IdSanPham=${id}`),
    add: entity=> db.add("daugia",entity)
}