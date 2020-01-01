const express = require('express');
const moment = require('moment');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const config = require('../config/default.json');
const lunr = require('lunr')

const router = express.Router();

let rowsSearch = [];
let listResult = [];
router.get('/',  async(req, res) => {
    rowsSearch = [];
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;
    let total = listResult.length;

    if (listResult.length === 0){
        rowsSearch = [];
    }
    else {
        rowsSearch = await productModel.allInIdArray(listResult,offset);         
    }
    console.log(rowsSearch);
    //res.render('vwSearch/search');

    

    

    for (let c of rowsSearch) {
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
    res.render('vwSearch/search', {
        keyword: req.body.keyword,
        num_of_page: nPages,
        isPage: +page,
        products: rowsSearch,
        empty: rowsSearch.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });
})

router.post('/', async (req, res) => {
    console.log(req.body);
    let allrows;
    if (+req.body.idCat === 0) {
        allrows =  await productModel.all();
    }
    else {
        allrows =  await productModel.allByCat(+req.body.idCat);
    }
    let idx = lunr(function () {
        this.field('title')
        for (c of allrows) {
            this.add({
                "id": c.IdSanPham,
                "title": c.TenSanPham
            })
        }
    })
        
    let result = idx.search(req.body.keyword);
    console.log(result);
    listResult = [];
    for (let c of result) {
        listResult.push(+c.ref)
    }
    console.log(listResult);
    rowsSearch = [];
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;
    let total = listResult.length;

    if (listResult.length === 0){
        rowsSearch = [];
    }
    else {
        rowsSearch = await productModel.allInIdArray(listResult,offset);         
    }
    
    //res.render('vwSearch/search');

    

    const current = moment().format("YYYY-MM-DD hh:mm:ss");
    


    for (let c of rowsSearch) {
        let nguoithang = await userModel.single(c.IdNguoiThang);
        let thoigianmoi = moment(current, "YYYY-MM-DD hh:mm:ss").subtract(10, 'minutes').format("YYYY-MM-DD hh:mm:ss");
        console.log(thoigianmoi);
        if (moment(thoigianmoi).isBefore(c.NgayDang)) 
            c.isNew = true;
        else 
            c.isNew = false;
        c.NguoiThang = nguoithang[0];
        c.NgayDang = moment(c.NgayDang, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
        c.ThoiHan = moment(c.NgayHetHan, "YYYY-MM-DD hh:mm:ss").fromNow();
        
    }

    //console.log(rowsSearch);
    
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
    res.render('vwSearch/search', {
        keyword: req.body.keyword,
        num_of_page: nPages,
        isPage: +page,
        products: rowsSearch,
        empty: rowsSearch.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });
})
module.exports = router;