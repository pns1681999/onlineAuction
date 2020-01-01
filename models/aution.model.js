db=require("../utils/db");

module.exports={
    single:id=> db.load(`select * from daugia where IdSanPham=${id}`),
    add: entity=> db.add("daugia",entity),
    maxaution:IdSanPham=>db.load(`SELECT a.IdSanPham, a.IdNguoiDung AS IdNguoiThang, a.Gia AS GiaHienTai, b.SoLuotRaGia FROM daugia a, sanpham b WHERE a.IdSanPham = b.IdSanPham AND a.IdSanPham = ${IdSanPham} AND a.Gia =( SELECT MAX(Gia) FROM daugia where IdSanPham = ${IdSanPham}  )`)
}