const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = mongoose.Schema({
    name: {
        type: String, 
        required:true
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    pic: {
        type: String,
        default:"https://cdn-icons-png.flaticon.com/512/1246/1246351.png?w=1380&t=st=1664559889~exp=1664560489~hmac=e03dabc8261a1df5f902f8dabf85e700ef8607076e95bd65cfddce669d2a95d6"
    },

}, { timestamps:true })

userSchema.pre("save", async function(next){
    if(!this.isModified){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePasswords = async function(password){
    return await bcrypt.compare(password, this.password)
}

const User = mongoose.model("User", userSchema)


module.exports = User