db=require("../utils/db");
const config = require('../config/default.json');

module.exports={
    single:id=> db.load(`select * from nangcap where IdSanPham=${id}`),
    
    add: entity=> db.add("nangcap",entity),
    
}