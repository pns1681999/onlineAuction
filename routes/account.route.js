const express = require('express');
const userModel = require('../models/user.model');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const productModel = require('../models/product.model');
const config = require('../config/default.json');

const router = express.Router();

router.get('/register', (req, res) =>{
    res.render('vwAccount/register', {layout: false});
})

router.post('/register', async (req, res) => {
    console.log(req.body);
    const N = 10;
    const hash = bcrypt.hashSync(req.body.txtPass, N);
    const dob = moment(req.body.txtDOB, 'DD/MM/YYYY').format('YYYY-MM-DD');

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
    res.render('home');
})
module.exports = router;