const express = require('express');
const userModel = require('../models/user.model');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const productModel = require('../models/product.model');
const cart=require("../models/cart.model");
const config = require('../config/default.json');
const restrict = require('../middlewares/auth.mdw');
const router = express.Router();
const aution=require('../models/aution.model');
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
    res.redirect('/');
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
    if (user.LoaiNguoiDung === 0)
        req.session.isAdmin=true;
    if (user.LoaiNguoiDung === 2)
        req.session.isSeller=true;
    req.session.authUser=user;


    if (user.LoaiNguoiDung==0)
    {
        const url=req.query.retUrl||'/admin/home';
        res.redirect(url);
    }
    else 
    {
        const url=req.query.retUrl||'/';
        res.redirect(url);
    }
})
router.post('/logout',(req,res)=>{
    req.session.isAuthenticated=false;
    req.session.isAdmin=false;
    req.session.isSeller=false;
    req.session.authUser=null;
     res.redirect('/');

})

router.get('/profile', restrict,  async(req,res)=>{
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
    const hash = bcrypt.hashSync(req.body.txtnewpass, 10);

    const entity={
        IdNguoiDung:req.body.txtIdNguoiDung,
        HoVaTen: req.body.txtHoVaTen,
        Email: req.body.txtEmail,
        NgaySinh: dob,
        MatKhau:hash

    }
    if(req.body.txtnewpass==='')
    {
        delete entity.MatKhau;
    }
    const user= await userModel.singleByEmail(req.body.txtEmail);
    
    const rs=bcrypt.compareSync(req.body.txtpass,user.MatKhau);
    if(rs===true)
    {

    const result=await userModel.patch(entity);
    }
    res.redirect('/account/profile');
})


router.get("/wishlist",restrict,async(req,res)=>{
    if(req.session.isAuthenticated==false){
        return res.redirect('/account/login?retUrl=/account/wishlist');
    }

    const bidderId = res.locals.authUser.IdNguoiDung;
    const limit = config.paginate.limit;
    let page = req.query.page || 1;
    if (page < 1) page = 1;
    const offset = (page - 1) * config.paginate.limit;

    let [total,rows] = await Promise.all([
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
    for (c of rows){
        c.NgayHetHan = moment(rows[0].NgayHetHan, "YYYY-MM-DD hh:mm:ss").format("DD/MM/YYYY");

    }
   
    
    res.render("vwAccount/wishlist",{
        product:rows,
        num_of_page: nPages,
        isPage: +page,
        empty: rows.length === 0,
        page_numbers,
        prev_value: +page - 1,
        next_value: +page + 1,
    });

})

router.post("/cart",async(req,res)=>{
    let entity=await productModel.cartinf(+req.body.txtId,+req.body.txtName);
    if(req.body.txtName!='')
    cart.add(entity);
    const url=req.query.retUrl||'/';
    res.redirect(url);
})



router.post("/deal",async(req,res)=>{
    const sp=await productModel.single(+req.body.txtId);
    const user=await userModel.single(+req.body.txtName);
    if((user[0].DiemCong*100)/(user[0].DiemCong+user[0].DiemTru)>=80)
    {
        //cập nhật thẳng lên db
        
        entity={
            IdSanPham:req.body.txtId,
            IdNguoiDung:req.body.txtName,
            TenNguoiMua:user[0].HoVaTen,
            Gia:+req.body.txtSoBuocGia* sp[0].BuocGia+ sp[0].GiaHienTai,
            NgayDauGia:moment().format("YYYY-MM-DD hh:mm:ss")
        };
        await aution.add(entity);

        
    }
    else{
        //gửi cho seller xem xét, nếu seller chấp nhận thì mới cập nhật lên dbdb

    }

    
    const url=req.query.retUrl;
    res.redirect(url);
})


module.exports = router;