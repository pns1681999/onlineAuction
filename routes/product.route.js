const express = require('express');
const moment = require('moment');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const config = require('../config/default.json');

const router = express.Router();

router.get('/:id', async (req, res) => {

    
    let rows = await productModel.single(req.params.id);

    let [rows1, nguoiban, nguoithang] = await Promise.all([
        productModel.allByCat(rows[0].LoaiSanPham),
        userModel.single(rows[0].IdNguoiBan),
        userModel.single(rows[0].IdNguoiThang)
    ]);

    for( let i = rows1.length-1; i--;){
        if ( rows1[i].IdSanPham === rows[0].IdSanPham) rows1.splice(i, 1);
    }
    for (let c of rows1) {
        let nguoithang = await userModel.single(c.IdNguoiThang);
        c.NguoiThang = nguoithang[0];
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    }

    
    rows[0].NgayDang = moment(rows[0].NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
    rows[0].ThoiHan = moment(rows[0].NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    res.render('vwProducts/singleProduct', {
        SanPhamLienQuan: rows1,
        product: rows[0],
        NguoiBan: nguoiban[0],
        NguoiThang: nguoithang[0]
    });
})

module.exports = router;