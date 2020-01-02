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

// router.post('/account/del',async(req,res)=>{

// })

// router.post('/patch',async(req,res)=>{
//     const dob = moment(req.body.txtNgaySinh, 'DD/MM/YYYY').format('YYYY-MM-DD');
//     const hash = bcrypt.hashSync(req.body.txtnewpass, 10);

//     const entity={
//         IdNguoiDung:req.body.txtIdNguoiDung,
//         HoVaTen: req.body.txtHoVaTen,
//         Email: req.body.txtEmail,
//         NgaySinh: dob,
//         MatKhau:hash

//     }
//     if(req.body.txtnewpass==='')
//     {
//         delete entity.MatKhau;
//     }
//     const user= await userModel.singleByEmail(req.body.txtEmail);
    
//     const rs=bcrypt.compareSync(req.body.txtpass,user.MatKhau);
//     if(rs===true)
//     {

//     const result=await userModel.patch(entity);
//     }
//     res.redirect('/account/profile');
// })


///////////////////CATEGORY
router.get('/category/list', async (req, res) =>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/admin/home');
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
        return res.redirect('/account/login?retUrl=/admin/home');
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
        return res.redirect('/account/login?retUrl=/admin/home');
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
        return res.redirect('/account/login?retUrl=/admin/home');
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

module.exports = router;