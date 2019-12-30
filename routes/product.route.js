const express = require('express');
const moment = require('moment');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const config = require('../config/default.json');
const multer = require('multer');
const restrict = require('../middlewares/auth.mdw');
const fs = require('fs');




const router = express.Router();

router.get('/:id', async (req, res) => {


    let rows = await productModel.single(req.params.id);

    let [rows1, nguoiban, nguoithang] = await Promise.all([
        productModel.allByCat(rows[0].LoaiSanPham),
        userModel.single(rows[0].IdNguoiBan),
        userModel.single(rows[0].IdNguoiThang)
    ]);

    for (let i = rows1.length - 1; i >= 0; i--) {
        if (rows1[i].IdSanPham === rows[0].IdSanPham) rows1.splice(i, 1);
    }
    for (let c of rows1) {
        let nguoithang = await userModel.single(c.IdNguoiThang);
        c.NguoiThang = nguoithang[0];
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    }

    //console.log(rows1);

    rows[0].NgayDang = moment(rows[0].NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
    rows[0].ThoiHan = moment(rows[0].NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    res.render('vwProducts/singleProduct', {
        SanPhamLienQuan: rows1,
        product: rows[0],
        NguoiBan: nguoiban[0],
        NguoiThang: nguoithang[0]
    });
})

router.get('/seller/insert', restrict, (req, res) => {
    res.render('vwProducts/insertProduct');
})

router.post('/seller/insert', async (req, res) => {
    let current = moment();
    const storage = multer.diskStorage({
        filename: function (req, file, cb) {
            cb(null, current.format('YYYYMMDDhhmmss') + '.jpg');
        },
        destination: function (req, file, cb) {
            cb(null, `./public/images/`);
        },
    });
    const upload = multer({ storage });
    upload.single('fuMain')(req, res, err => {
        if (err) { }
        res.redirect('/');
        console.log(req.file, req.body);
        let hethan = moment(current).add(10, 'days');
        let entity = {
            TenSanPham: req.body.txtTensanpham,
            LoaiSanPham: req.body.idCat,
            ChiTiet: req.body.FullDes,
            GiaKhoiDiem: req.body.numGiakhoidiem,
            NgayDang: current.format('YYYY-MM-DD hh:mm:ss'),
            NgayHetHan: hethan.format('YYYY-MM-DD hh:mm:ss'),
            //BuocGia: req.body.numBuocGia,
            GiaHienTai: 0,
            IdNguoiBan: req.session.authUser.IdNguoiDung,
            GiaMuaNgay: req.body.numGiamuangay,
            SoLuotRaGia: 0,
        };
        (async (entity, current) => {
            const result = await productModel.add(entity);
            console.log(current.format('YYYY-MM-DD hh:mm:ss'));
            const newProduct = await productModel.singleWithDatetime(current.format('YYYY-MM-DD hh:mm:ss'));
            console.log(newProduct[0]);
            fs.mkdir('./public/images/product/' + newProduct[0].IdSanPham, { recursive: true }, (err) => {
                if (err) throw err;
            });
            fs.rename('./public/images/' + current.format('YYYYMMDDhhmmss') + '.jpg', './public/images/product/' + newProduct[0].IdSanPham + '/1.jpg', function (err) {
                if (err) console.log('ERROR: ' + err);
            });
        })(entity, current);


    });



})

module.exports = router;