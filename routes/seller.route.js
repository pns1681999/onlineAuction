const express = require('express');
const moment = require('moment');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const config = require('../config/default.json');
const multer = require('multer');
const restrict = require('../middlewares/auth.mdw');
const fs = require('fs');




const router = express.Router();

router.get('/insertProduct', restrict, (req, res) => {
    res.render('vwSeller/insertProduct');
})

router.post('/insertProduct', async (req, res) => {
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
            BuocGia: req.body.numBuocGia,
            TuGiaHan: req.body.giahan,
            TinhTrang: 0,
            GiaHienTai: req.body.numGiakhoidiem,
            IdNguoiBan: req.session.authUser.IdNguoiDung,
            GiaMuaNgay: req.body.numGiamuangay,
            DanhGia: 0,
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

router.get('/productAvailable', restrict, async (req, res) => {
    for (const c of res.locals.lcCategories[1]) {
        if (c.IdDanhMuc === +req.params.id) {
          c.isActive = true;
        }
    }

    const sellerId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;

    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total, rows] = await Promise.all([
        productModel.countAvailableBySeller(sellerId),
        productModel.pageAvailableBySeller(sellerId, offset)
    ]);

    for (let c of rows) {
        let nguoithang = await userModel.single(c.IdNguoiThang);
        c.NguoiThang = nguoithang[0];
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    }
    
    let nPages = Math.floor(total / limit);
    if (total % limit > 0) nPages++;
    if (page > nPages) page = nPages;
    let page_numbers = [];
    for (i = 1; i <= nPages; i++) {
        page_numbers.push({
        value: i,
        isCurrentPage: i === +page
        })
    }
    res.render('vwSeller/ownProduct', {
        num_of_page: nPages,
        isPage: +page,
        products: rows,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });
})

router.get('/productAuctioned', restrict, async (req, res) => {
    for (const c of res.locals.lcCategories[1]) {
        if (c.IdDanhMuc === +req.params.id) {
          c.isActive = true;
        }
    }

    const sellerId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;

    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total, rows] = await Promise.all([
        productModel.countAuctionedBySeller(sellerId),
        productModel.pageAuctionedBySeller(sellerId, offset)
    ]);

    for (let c of rows) {
        let nguoithang = await userModel.single(c.IdNguoiThang);
        c.NguoiThang = nguoithang[0];
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
    }
    
    let nPages = Math.floor(total / limit);
    if (total % limit > 0) nPages++;
    if (page > nPages) page = nPages;
    let page_numbers = [];
    for (i = 1; i <= nPages; i++) {
        page_numbers.push({
        value: i,
        isCurrentPage: i === +page
        })
    }
    res.render('vwSeller/ownProduct', {
        isAuctioned: true,
        num_of_page: nPages,
        isPage: +page,
        products: rows,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });
})

router.post('/addDescription/:id', restrict, async (req, res) => {
    const id = req.params.id;
    let rows = await productModel.single(id);
    let current = moment().format('DD-MM-YYYY');
    rows[0].ChiTiet = rows[0].ChiTiet + '<br>- <span class = "fa fa-pencil"></span> '+current+':<br>'+req.body.FullDes;
    const result = await productModel.patch(rows[0]);
    res.redirect('/products/'+id);
})

router.post('/voteLike/bidder=:id1/product=:id2', async(req, res) =>{
    const idBidder=req.params.id1;
    const idProduct=req.params.id2;
    let rows1 = await userModel.single(idBidder);
    let rows2 = await productModel.single(idProduct);
    rows1[0].DiemCong = rows1[0].DiemCong + 1;
    rows2[0].DanhGia = 1;
    const result1 = await userModel.patch(rows1[0]);
    const result2 = await productModel.patch(rows2[0]);
    res.redirect('/seller/productAuctioned');
})
router.post('/voteDislike/bidder=:id1/product=:id2', async(req, res) =>{
    const idBidder=req.params.id1;
    const idProduct=req.params.id2;
    let rows1 = await userModel.single(idBidder);
    let rows2 = await productModel.single(idProduct);
    rows1[0].DiemTru = rows1[0].DiemTru + 1;
    rows2[0].DanhGia = 1;
    const result1 = await userModel.patch(rows1[0]);
    const result2 = await productModel.patch(rows2[0]);
    res.redirect('/seller/productAuctioned');
})

module.exports = router;