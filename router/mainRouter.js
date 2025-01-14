const express = require('express')
const mainRouter = express()
const ejs = require('ejs')
const env = require('../environment/env')
const adminauth = require('../middleware/adminauth')
mainRouter.set('view engine','ejs')
mainRouter.set('views','views')
mainRouter.use("/public",express.static('./public'));
mainRouter.use('/assets',express.static('assets'));
const userModel = require('../models/userModel')
const products = require('../constants/products')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const multer = require('multer')
mainRouter.use(bodyParser.urlencoded({extended:true}))
const session = require('express-session');
mainRouter.use(bodyParser.json())
const path = require('path')
const fs = require('fs')
mainRouter.use(cookieParser())

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/user_documents'),function(error,success){
            if(error) throw error
        })
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
        cb(null,name),function(error,success){
            if(error) throw error
        }
    }

})

const upload = multer({storage:storage})


mainRouter.use(session(
    {
        secret:"Mysecret",
        resave:false,
        saveUninitialized:false
    }
))
mainRouter.get('/',(req,res)=>
{
    res.render('index')
}
)

mainRouter.get('/admin/adminLogin',(req,res)=>
{
    res.render('adminLogin')
}
)
mainRouter.get('/admin/adminDashboard',adminauth.adminisLogin,(req,res)=>
{
    res.render('adminDashboard')
})
mainRouter.get('/adminBooking',adminauth.adminisLogin,(req,res)=>
{

    res.render('adminBooking')
})
mainRouter.get('/admin/adminDownload',adminauth.adminisLogin,(req,res)=>
{
    res.render('adminDownload')
})
mainRouter.post('/admin/adminLogin',(req,res)=>
{
    try
    {
      
        
        if(env.admin_id == req.body.admin_id && env.admin_password == req.body.admin_password)
        {
            req.session.admin_id = req.body.admin_id
            return res.status(200).json("Login Successful")
        }
        else
        {
            return res.status(400).json("Invalid Credentials")
        }
    }
    catch(error)
    {
        console.log(error.message)
    }
    
})

mainRouter.get('/admin/booking',(req,res)=>
{
    res.render('booking')
})
mainRouter.get('/exchange',(req,res)=>
{
    res.render('exchange')
})

mainRouter.get('/login',(req,res)=>
{
    res.render('login')
})


const generateOtp = ()=>
{
    return Math.floor(1000 + Math.random() * 9000)
}

mainRouter.post('/login',async (req,res)=>
{
    console.log(req.body)
    if(req.body.mobile.length != 10 )
    {
        return res.status(400).json("Invalid Mobile Number")
    }
    try
    {
        const user = await userModel.findOne({mobile:req.body.mobile})
        if(user)
        {
            const otp = generateOtp()
            await userModel.findOneAndUpdate({mobile:req.body.mobile},{otp:otp})
            return res.status(200).json({otp:otp.toString(),mobile:req.body.mobile,name:req.body.name})
            
        }
        else
        {
            await userModel.create(req.body)
            const otp = generateOtp()
            await userModel.findOneAndUpdate({mobile:req.body.mobile},{otp:otp})
            return res.status(200).json({otp:otp.toString(),mobile:req.body.mobile,name:req.body.name})
        }
    }
    catch(error)
    {
        console.log(error.message)
    }
    
})

mainRouter.get('/verify-otp',(req,res)=>
{

    res.render('loginOTP',{mobile:req.query.mobile,name:req.query.name})
})
mainRouter.post('/verify-otp',async (req,res)=>{
   try
   {
         const user = await userModel.findOne({mobile:req.body.mobile})
        
            if(user.otp == req.body.otp)
            {
                res.cookie('user_name',user.name)
                res.cookie('user_mobile',user.mobile)
                await userModel.findOneAndUpdate({mobile:req.body.mobile},{otp:null})
                return res.status(200).json("Login Successful")
            }
            else
            {
                return res.status(400).json("Invalid Otp")
            }
   }
   catch(error)
   {
       console.log(error.message)
   }
})
mainRouter.get('/userDashboard',async  (req,res)=>
{
    try
    {
         const product = await userModel.findOne({mobile:req.cookies.user_mobile})
         if(product.products.length == 0)
         {
                return res.render('userDashboard',{products:[]})
         }
         else
         {
            res.render('userDashboard',{products:product.products})
         }
        
    }

    catch(error)
    {
        console.log(error.message)
    }
    
})

mainRouter.get('/add_product_to_cart', async (req,res)=>
{
    try
    {
        const user = await userModel.findOne({mobile:req.query.mobile})
        const product = products.find((product)=>product.product_id == req.query.product_id)
        user.products.push(product)
        await user.save()
        res.redirect('/userDashboard')
        
    }
    catch(error)
    {
        console.log(error.message)
    }
})
mainRouter.get('/user_details', async  (req,res)=>
{
    
    try
    {
       const user = await userModel.findOne({mobile:req.cookies.user_mobile})
       res.status(200).json(user)
    }
    catch(error)
    {
        console.log(error.message)
    }
})

mainRouter.post('/create_folder' , async (req,res)=>
{
    try
    {
       const user = await userModel.findOne({mobile:req.cookies.user_mobile})
       user.folders.push({folder_name:req.body.folder_name})
       await user.save()
       res.status(200).json("Folder Created Successfully")
    }
    catch(error)
    {
        console.log(error.message)
    }
})

mainRouter.post('/upload_file',upload.single('document') ,async (req,res)=>
{
    try
    {
        const user = await userModel.findOne({mobile:req.cookies.user_mobile})
        user.files.push({file_path:req.file.filename,folder_id:req.body.folder_id})
        await user.save()
        res.status(200).json("File Uploaded Successfully")
    }
    catch(error)
    {
        console.log(error.message)
    }
})

mainRouter.get('/get_folders',async (req,res)=>
{
    try
    {
        const user = await userModel.findOne({mobile:req.cookies.user_mobile})
        res.status(200).json(user.folders)
    }
    catch(error)
    {
        console.log(error.message)
    }
})
mainRouter.get('/get_files',async (req,res)=>
{
    try
    {
        const data = await userModel.findOne({mobile:req.cookies.user_mobile})
        const foldersWithFiles = data.folders.map(folder => {
            const filesInFolder = data.files
              .filter(file => file.folder_id == folder._id)
              .map(file => file.file_path);
          
            return {
              folder_name: folder.folder_name,
              _id: folder._id,
              files: filesInFolder
            };
          });
          
          res.status(200).json(foldersWithFiles);
        
    }
    catch(error)
    {
        console.log(error.message)
    }
})

// admin 
mainRouter.get('/admin/user_files',async (req,res)=>
{
    try
    {
        const data = await userModel.findOne({mobile:req.body.user_mobile})
        const foldersWithFiles = data.folders.map(folder => {
            const filesInFolder = data.files
              .filter(file => file.folder_id == folder._id)
              .map(file => file.file_path);
          
            return {
              folder_name: folder.folder_name,
              _id: folder._id,
              files: filesInFolder
            };
          });
          
          res.status(200).json(foldersWithFiles);
    }
    catch(error)
    {
         console.log(error.message)
    }
})

mainRouter.get('/logout',(req,res)=>
{
    res.clearCookie('user_mobile');
    res.clearCookie('user_name')
	res.redirect('/');
})

module.exports = mainRouter

mainRouter.get('/userDashboardsubmit',(req,res)=>
{
    res.render('userDashboardsubmit')
})
mainRouter.get('/cancel',(req,res)=>
{
    res.render('cancel')
})
mainRouter.get('/contact',(req,res)=>
{
    res.render('contact')
})

mainRouter.get('/table',(req,res)=>
{
    res.render('table')
})
mainRouter.get('/blogdetails',(req,res)=>
{
    res.render('blogdetails')
})
mainRouter.get('/loginemail',(req,res)=>
{
    res.render('loginemail')
})
mainRouter.get('/tools',(req,res)=>
{
    res.render('tools')
})
mainRouter.get('/faq',(req,res)=>
{
    res.render('faq')
})
mainRouter.get('/userDashboardFolder',(req,res)=>
{
    res.render('userDashboardFolder')
})