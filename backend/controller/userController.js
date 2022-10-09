const asyncHandler = require('express-async-handler')
const User = require('../schema/userSchema')
const generateToken = require("../config/generateToken")
//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public

const allUsers = asyncHandler(async (req,res) => {
    const keyword = req.query.search?
    {
            $or:[
            {name:{$regex:req.query.search, $options:'i'}},
            {name:{$regex:req.query.search, $options:'i'}},
        ]
} : {}
    const users = await  User.find(keyword).find({_id: {$ne:req.user._id}})
    res.send(users)
})


const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password, pic} = req.body
    if(!name || !email || !password){
        res.status(400);
        throw new Error('Please Enter All The Fields')
    }
    const userExist = await User.findOne({email})
    if(userExist){
        res.status(400);
        throw new Error("User already exist")
    }
    const user = await User.create({name, email, password, pic})
    if(user){
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            password:user.password,
            pic:user.pic,
            token:await generateToken(user._id)
        })
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({email})
    if(user && (await user.comparePasswords(password))){
        res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            password:user.password,
            pic:user.pic,
            token:await generateToken(user._id)
        })
    }else{
        res.status(401)
        throw new Error("Invalid Login or Password")
    }
})



module.exports = {
    registerUser,
    loginUser,
    allUsers
}