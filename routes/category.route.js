const express = require('express');
const productModel = require('../models/product.model');
const config = require('../config/default.json');

const router = express.Router();

router.get('/:id/products', async(req, res) => {
    for (const c of res.locals.lcCategories[1]) {
        if (c.IdDanhMuc === +req.params.id) {
          c.isActive = true;
        }
    }

    const catId = req.params.id;
    const limit = config.paginate.limit;

    const page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    const [total, rows] = await Promise.all([
        productModel.countByCat(catId),
        productModel.pageByCat(catId, offset)
    ]);

    
    let nPages = Math.floor(total / limit);
    if (total % limit > 0) nPages++;
    if (page > nPages) page = nPages;
    const page_numbers = [];
    for (i = 1; i <= nPages; i++) {
        page_numbers.push({
        value: i,
        isCurrentPage: i === +page
        })
    }

    res.render('vwProducts/allByCat', {
        products: rows,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });
})

module.exports = router;