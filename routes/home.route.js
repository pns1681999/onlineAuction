const express = require('express');
const moment = require('moment');
const productModel = require('../models/product.model');

const router = express.Router();
router.get('/', async (req, res) => {

    let [rows1, rows2, rows3] = await Promise.all([
        productModel.topNearExpiry(),
        productModel.topMostBids(),
        productModel.topHighBid()
    ]);
    for (let c of rows1) {
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();

    }
    for (let c of rows2) {
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();

    }
    for (let c of rows3) {
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();

    }

    res.render('home', {
        near_expiry: rows1,
        most_bids: rows2,
        high_bid: rows3,
    });
})

module.exports = router;