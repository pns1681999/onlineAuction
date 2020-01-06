const express = require('express');
const userModel = require('../models/user.model');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const productModel = require('../models/product.model');
const allowModel = require('../models/allow.model');
const cart = require("../models/cart.model");
const config = require('../config/default.json');
const restrict = require('../middlewares/auth.mdw');
const nodemailer = require('nodemailer');
const router = express.Router();
const aution = require('../models/aution.model');
const uptoseller = require('../models/uptoseller.model');
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "webapponlineauction@gmail.com",
        pass: "OnlineAuction99"
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
})

router.get('/register', (req, res) => {
    res.render('vwAccount/register', { layout: false });
})

router.post('/register', async (req, res) => {
    const N = 10;
    const hash = bcrypt.hashSync(req.body.txtPass, N);
    const dob = moment(req.body.txtDOB, 'DD/MM/YYYY').format('YYYY-MM-DD');

    let validUsername = await userModel.allByUsername(req.body.txtUsername);
    if (validUsername.length > 0) {
        return res.render('vwAccount/register', {
            layout: false,
            err_message: 'username is valid'
        })
    }

    let validEmail = await userModel.allByEmail(req.body.txtEmail);
    if (validEmail.length > 0) {
        return res.render('vwAccount/register', {
            layout: false,
            err_message: 'email is valid'
        })
    }

    let entity = {

        TenDangNhap: req.body.txtUsername,
        MatKhau: hash,
        HoVaTen: req.body.txtName,
        Email: req.body.txtEmail,
        NgaySinh: dob,
        LoaiNguoiDung: 1,
        DiemCong: 0,
        DiemTru: 0,
    }

    const result = await userModel.add(entity);
    res.redirect('/');
})

router.get('/login', (req, res) => {
    res.render('vwAccount/login', { layout: false });
})

router.post('/login', async (req, res) => {
    const user = await userModel.singleByUsername(req.body.username);

    if (user === null) {
        return res.render('vwAccount/login', {
            layout: false,
            err_message: 'invalid username or passwords'
        })
    }

    const rs = bcrypt.compareSync(req.body.password, user.MatKhau);
    if (rs === false) {
        return res.render('vwAccount/login', {
            layout: false,
            err_message: 'Login failed'
        })
    }
    delete user.MatKhau;
    req.session.isAuthenticated = true;
    if (user.LoaiNguoiDung === 0)
        req.session.isAdmin = true;
    if (user.LoaiNguoiDung === 2)
        req.session.isSeller = true;
    req.session.authUser = user;


    if (user.LoaiNguoiDung == 0) {
        const url = req.query.retUrl || '/admin/home';
        res.redirect(url);
    }
    else {
        const url = req.query.retUrl || '/';
        res.redirect(url);
    }
})
router.post('/logout', (req, res) => {
    req.session.isAuthenticated = false;
    req.session.isAdmin = false;
    req.session.isSeller = false;
    req.session.authUser = null;
    res.redirect('/');

})

router.get('/profile', restrict, async (req, res) => {
    const profile = await userModel.singleByUsername(req.session.authUser.TenDangNhap);
    delete profile.MatKhau;

    profile.NgaySinh = moment(profile.NgaySinh, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
    res.render('vwAccount/profile', {
        infor: profile
    });

})

router.post('/account/del', async (req, res) => {

})
router.post('/patch', async (req, res) => {
    const dob = moment(req.body.txtNgaySinh, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const hash = bcrypt.hashSync(req.body.txtnewpass, 10);

    const entity = {
        IdNguoiDung: req.body.txtIdNguoiDung,
        HoVaTen: req.body.txtHoVaTen,
        Email: req.body.txtEmail,
        NgaySinh: dob,
        MatKhau: hash

    }
    if (req.body.txtnewpass === '') {
        delete entity.MatKhau;
    }
    const user = await userModel.singleByEmail(req.body.txtEmail);

    const rs = bcrypt.compareSync(req.body.txtpass, user.MatKhau);
    if (rs === true) {

        const result = await userModel.patch(entity);
    }
    res.redirect('/account/profile');
})



router.get("/wishlist", restrict, async (req, res) => {
    if (req.session.isAuthenticated == false) {
        return res.redirect('/account/login?retUrl=/account/wishlist');
    }

    const bidderId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total, rows] = await Promise.all([
        cart.countWatchedByBidder(bidderId),
        cart.pageWatchedByBidder(bidderId, offset)
    ]);


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
    for (c of rows) {
        c.NgayHetHan = moment(rows[0].NgayHetHan, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");

    }


    res.render("vwAccount/wishlist", {
        product: rows,
        num_of_page: nPages,
        isPage: +page,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });

})

router.post("/cart", async (req, res) => {
    let entity = await productModel.cartinf(+req.body.txtId, +req.body.txtName);
    if (req.body.txtName != '')
        cart.add(entity);
    const url = req.query.retUrl || '/';
    res.redirect(url);
})



router.post("/deal", async (req, res) => {
    const sp = await productModel.single(+req.body.txtId);
    const user = await userModel.single(+req.body.txtName);
    const seller = await userModel.single(sp[0].IdNguoiBan);
    const allow = await allowModel.single(seller[0].IdNguoiDung, sp[0].IdSanPham, user[0].IdNguoiDung);
    let confirm = 0;
    if (typeof (allow[0]) === 'undefined') {
        if ((user[0].DiemCong * 100) / (user[0].DiemCong + user[0].DiemTru) >= 80) {
            //cập nhật thẳng lên db
            let gia = +req.body.txtSoBuocGia * sp[0].BuocGia + sp[0].GiaHienTai,
                entity = {
                    IdSanPham: req.body.txtId,
                    IdNguoiDung: req.body.txtName,
                    TenNguoiMua: user[0].HoVaTen,
                    Gia: gia,
                    NgayDauGia: moment().format("YYYY-MM-DD hh:mm:ss")
                }
            await aution.add(entity);

            const maxaution = await aution.maxaution(+req.body.txtId);
            if (maxaution[0] != null) {
                maxaution[0].SoLuotRaGia = maxaution[0].SoLuotRaGia + 1;
                const l = await productModel.patch(maxaution[0]);
                entity2 = {
                    GiaHienTai: maxaution[0].GiaHienTai,
                    IdSanPham: req.body.txtId
                }
                await cart.patch(entity2);
            }


            confirm = 1;
            let mail = await transporter.sendMail({
                from: "webapponlineauction@gmail.com",
                to: user[0].Email,
                subject: "Thông báo", // Subject line
                text: "Kết quả ra giá", // plain text body
                html: "Bạn được ra giá <b>thành công</b> sản phẩm <b>" + sp[0].TenSanPham + "</b> với giá <b>" + gia + "</b>." // html body
            });


        }
        else {
            entity = {
                IdNguoiBan: seller[0].IdNguoiDung,
                IdSanPham: sp[0].IdSanPham,
                IdNguoiMua: user[0].IdNguoiDung,
                Quyen: 2 //Chờ duyệt
            }
            allowModel.add(entity);
            confirm = 2;
        }

    }
    else if (allow[0].Quyen === 2) {
        confirm = 2 //chờ duyệt
    }
    else if (allow[0].Quyen === 1) {
        let gia = +req.body.txtSoBuocGia * sp[0].BuocGia + sp[0].GiaHienTai,
            entity = {
                IdSanPham: req.body.txtId,
                IdNguoiDung: req.body.txtName,
                TenNguoiMua: user[0].HoVaTen,
                Gia: gia,
                NgayDauGia: moment().format("YYYY-MM-DD hh:mm:ss")
            }
        await aution.add(entity);
        const maxaution = await aution.maxaution(+req.body.txtId);
        if (maxaution[0] != null) {
            maxaution[0].SoLuotRaGia = maxaution[0].SoLuotRaGia + 1;
            const l = await productModel.patch(maxaution[0]);
            entity2 = {
                GiaHienTai: maxaution[0].GiaHienTai,
                IdSanPham: req.body.txtId
            }
            await cart.patch(entity2);
        }

        confirm = 1;
        let mail = await transporter.sendMail({
            from: "webapponlineauction@gmail.com",
            to: user[0].Email,
            subject: "Thông báo", // Subject line
            text: "Kết quả ra giá", // plain text body
            html: "Bạn được ra giá <b>thành công</b> sản phẩm <b>" + sp[0].TenSanPham + "</b> với giá <b>" + gia + "</b>." // html body
        });
    }




    const url = req.query.retUrl;

    res.render('vwConfirm/confirm', {
        isConfirm: confirm,
        url: url
    });
})


router.get("/productAutioning", restrict, async (req, res) => {
    if (req.session.isAuthenticated == false) {
        return res.redirect('/account/login?retUrl=/account/productAutioning');
    }

    const bidderId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total, rows] = await Promise.all([
        aution.countAutionByBidder(bidderId),
        aution.pageAutionByBidder(bidderId, offset)
    ]);




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
    for (c of rows) {
        c.NgayHetHan = moment(rows[0].NgayHetHan, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        if (c.IdNguoiThang != bidderId)
            c.config = 0;
        else
            c.config = 1




    }

    res.render("vwAccount/autioning", {
        product: rows,
        num_of_page: nPages,
        isPage: +page,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });

})


router.get("/productAuctioned", restrict, async (req, res) => {
    if (req.session.isAuthenticated == false) {
        return res.redirect('/account/login?retUrl=/account/productAutioned');
    }

    const bidderId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total, rows] = await Promise.all([
        productModel.countAuctionedByBidder(bidderId),
        productModel.pageAuctionedByBidder(bidderId, offset)
    ]);




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
    res.render("vwAccount/autioned", {
        product: rows,
        num_of_page: nPages,
        isPage: +page,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });

})








router.get("/uptoseller", async (req, res) => {
    if (req.session.isAuthenticated == false) {
        return res.redirect('/account/login');
    }
    entity = {
        IdNguoiDung: res.locals.authUser.IdNguoiDung

    }
    uptoseller.add(entity);
    const user = await userModel.single(+res.locals.authUser.IdNguoiDung);
    confirm = 3;
    if (+user[0].LoaiNguoiDung != 1)
        confirm = -1
    res.render('vwConfirm/confirm', {
        isConfirm: confirm,
        url: '/'
    });
})



router.get("/delwishlist/:id", async (req, res) => {
    cart.delProduct(+req.params.id, +res.locals.authUser.IdNguoiDung);
    res.redirect('/account/wishlist');

})
module.exports = router;