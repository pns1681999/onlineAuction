db=require("../utils/db");

module.exports={
    single:id=> db.load(`select * from wishlist where IdNguoiDung=${id}`),
    add: entity=> db.add("wishlist",entity)
}