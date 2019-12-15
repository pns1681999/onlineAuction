const express = require('express');
const moment = require('moment');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const config = require('../config/default.json');
const lunr = require('lunr')

const router = express.Router();

router.post('/', async (req, res) => {
    console.log(req.body);
    let rows;
    if (+req.body.idCat === 0) {
        rows =  await productModel.all();
    }
    else {
        rows =  await productModel.allByCat(+req.body.idCat);
    }
    let idx = lunr(function () {
        this.field('title')
        for (c of rows) {
            this.add({
                "id": c.IdSanPham,
                "title": c.TenSanPham
            })
        }
    })
        
    let result = idx.search(req.body.keyword);
    console.log(result);
    let listResult = [];
    for (let c of result) {
        listResult.push(+c.ref)
    }
    console.log(listResult);
    let rows1;
    if (listResult.length === 0){
        rows1 = [];
    }
    else {
        rows1 = await productModel.allInIdArray(listResult);         
    }
    console.log(rows1);
    res.render('vwSearch/search');
})
module.exports = router;