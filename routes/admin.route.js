const express = require('express');
const userModel = require('../models/user.model');
const categoryModel = require('../models/category.model');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const productModel = require('../models/product.model');
const cart=require("../models/cart.model");
const config = require('../config/default.json');
const router = express.Router();

///////////////////HOME
router.get('/home',(req,res)=>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
    
    res.render('vwAdmin/home', {layout: 'admin_layout.hbs'});
})

router.post('/logout',(req,res)=>{
    req.session.isAuthenticated=false;
    req.session.authUser=null;
     res.redirect('/');

})

router.get('/profile',async(req,res)=>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/account/profile');
    }
    const profile=await userModel.singleByUsername(req.session.authUser.TenDangNhap);
    delete profile.MatKhau;
    
    profile.NgaySinh = moment(profile.NgaySinh, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");
    res.render('vwAccount/profile',{
        infor:profile
    });

})

///////////////////CATEGORY
router.get('/category/list', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/category/list');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
    
    const rows = await categoryModel.all();
    
    res.render('vwAdmin/category/list',  {
        danhmuc: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/category/detail/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows1 = await categoryModel.allOfId(req.params.id);
    const rows2 = await categoryModel.allProductsOfId(req.params.id);
    res.render('vwAdmin/category/detail',  {
        danhmuc: rows1,
        sanpham: rows2,
        empty1: rows1.length == 0,
        empty2: rows2.length == 0,
        layout: 'admin_layout.hbs'
    });
})

router.get('/category/add', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/category/add');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows = await categoryModel.all();
    
    res.render('vwAdmin/category/add',  {
        danhmuc: rows,
        layout: 'admin_layout.hbs'
      });
})

router.post('/category/add', async (req, res) => {
    let entity = {
        TenDanhMuc: req.body.txtCatName,
        ThuocDanhMuc: req.body.txtCatType,
    }

    const result = await categoryModel.add(entity);

    const rows = await categoryModel.all();
    res.render('vwAdmin/category/list',  {
        danhmuc: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/category/update/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows = await categoryModel.single(req.params.id);
    const rows_1 = await categoryModel.all();

    res.render('vwAdmin/category/update',  {
        danhmuc1: rows[0],
        danhmuc: rows_1,
        layout: 'admin_layout.hbs'
    });
})

router.post('/category/update/:id', async (req, res) => {
    const result = await categoryModel.patch(req.body);

    const rows = await categoryModel.all();
    res.render('vwAdmin/category/list',  {
        danhmuc: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
  })
  
router.get('/category/delete/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
        
    const rows1 = await categoryModel.allOfId(req.params.id);
    const rows2 = await categoryModel.allProductsOfId(req.params.id);

    if (rows1.length==0 && rows2.length==0)
    {
        const result = await categoryModel.del(req.params.id);

        const rows = await categoryModel.all();
        res.render('vwAdmin/category/list',  {
            danhmuc: rows,
            empty: rows.length === 0,
            layout: 'admin_layout.hbs'
        });
    }

    else
    {
        res.render('vwAdmin/category/delete',  {layout: 'admin_layout.hbs'});
    }
    
})

///////////////////USER
router.get('/user/list', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/user/list');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
    
    const rows = await userModel.all();
    
    res.render('vwAdmin/user/list',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/add', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/user/add');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows = await categoryModel.all();
    
    res.render('vwAdmin/user/add',  {layout: 'admin_layout.hbs'});
})

router.post('/user/add', async (req, res) => {
    const N = 10;
    const hash = bcrypt.hashSync(req.body.MatKhau, N);
    const dob = moment(req.body.NgaySinh, 'DD/MM/YYYY').format('YYYY-MM-DD');

    let entity = {
        TenDangNhap: req.body.TenDangNhap,
        MatKhau: hash,
        HoVaTen: req.body.HoVaTen,
        Email: req.body.Email,
        NgaySinh: dob,
        LoaiNguoiDung: req.body.LoaiNguoiDung,
        DiemCong: 0,
        DiemTru: 0,
    }

    const result = await userModel.add(entity);

    const rows = await userModel.all();
    
    res.render('vwAdmin/user/list',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/detail/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows = await userModel.single(req.params.id);
    res.render('vwAdmin/user/detail',  {
        nguoidung: rows[0],
        isAdmin: rows[0].LoaiNguoiDung==0,
        isBuyer: rows[0].LoaiNguoiDung==1,
        isSeller: rows[0].LoaiNguoiDung==2,
        layout: 'admin_layout.hbs'
    });
})

router.get('/user/upgrade', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/user/upgrade');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
    
    const rows = await userModel.buyer();
    
    res.render('vwAdmin/user/upgrade',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/upgrade/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    let entity = {
        IdNguoiDung: req.params.id,
        LoaiNguoiDung: 2,
    }

    const result = await userModel.patch(entity);
    
    const rows = await userModel.buyer();
    
    res.render('vwAdmin/user/upgrade',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/degrade', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/user/degrade');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
    
    const rows = await userModel.seller();
    
    res.render('vwAdmin/user/degrade',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/degrade/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    let entity = {
        IdNguoiDung: req.params.id,
        LoaiNguoiDung: 1,
    }

    const result = await userModel.patch(entity);
    
    const rows = await userModel.seller();
    
    res.render('vwAdmin/user/degrade',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
      });
})

router.get('/user/update/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const rows = await userModel.single(req.params.id);
    res.render('vwAdmin/user/update',  {
        nguoidung: rows[0],
        layout: 'admin_layout.hbs'
    });
})

router.post('/user/update/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');

    const N = 10;
    const hash = bcrypt.hashSync(req.body.MatKhau, N);
    const dob = moment(req.body.NgaySinh, 'DD/MM/YYYY').format('YYYY-MM-DD');

    let entity = {
        IdNguoiDung: req.body.IdNguoiDung,
        MatKhau: hash,
        HoVaTen: req.body.HoVaTen,
        Email: req.body.Email,
        NgaySinh: dob,
        LoaiNguoiDung: req.body.LoaiNguoiDung,
        DiemCong: req.body.DiemCong,
        DiemTru: req.body.DiemTru,
    }
    
    const result = await userModel.patch(entity);

    
    const rows = await userModel.single(req.params.id);
    res.render('vwAdmin/user/detail',  {
        nguoidung: rows[0],
        isAdmin: rows[0].LoaiNguoiDung==0,
        isBuyer: rows[0].LoaiNguoiDung==1,
        isSeller: rows[0].LoaiNguoiDung==2,
        layout: 'admin_layout.hbs'
    });
})

router.get('/user/delete/:id', async (req, res) => {
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
    }
    
    if (req.session.authUser.LoaiNguoiDung!=0)
        return res.render('vwError/permission');
        
    const result = await userModel.del(req.params.id);

    const rows = await userModel.all();
    
    res.render('vwAdmin/user/list',  {
        nguoidung: rows,
        empty: rows.length === 0,
        layout: 'admin_layout.hbs'
    });
})
module.exports = router;