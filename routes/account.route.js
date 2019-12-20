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

router.get('/login',(req,res)=>{
    res.render('vwAccount/login', {layout: false});

})

router.post('/login',async(req,res)=>{
    const user= await userModel.singleByUsername(req.body.username);

    if (user===null)
    {
        return res.render('vwAccount/login',{
            layout:false,
            err_message:'invalid username or passwords'
        })
    }
    
    const rs=bcrypt.compareSync(req.body.password,user.MatKhau);
    if(rs===false){
        return res.render('vwAccount/login',{
            layout:false,
            err_message:'Login failed'
        })
    }
    delete user.MatKhau;
    req.session.isAuthenticated=true;
    req.session.authUser=user;
    const url=req.query.retUrl||'/';
    res.redirect(url);






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

router.post('/account/del',async(req,res)=>{

})
router.post('/patch',async(req,res)=>{
    const dob = moment(req.body.txtNgaySinh, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const entity={
        IdNguoiDung:req.body.txtIdNguoiDung,
        HoVaTen: req.body.txtHoVaTen,
        Email: req.body.txtEmail,
        NgaySinh: dob,
        //MatKhau:req.body.txtnewpass

    }
    //if(req.body.txtnewpass==='')
    //{
        delete entity.MatKhau;
    //}
    //const user= await userModel.singleByEmail(req.body.txtEmail);
    
    //const rs=bcrypt.compareSync(req.body.txtpass,user.MatKhau);
    
    const result=await userModel.patch(entity);
    res.redirect('/account/profile');
})


module.exports = router;