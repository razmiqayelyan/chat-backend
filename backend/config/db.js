const mongoose = require("mongoose")

const connectDB = async() => {
    try {
        const db = mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log("MongoDB connected")
    } catch (error) {
        console.log("Error", error);
        process.exit()
    }
}
module.exports = connectDB