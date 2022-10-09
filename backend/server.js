const express = require("express")
const userRouter = require("./router/userRouter")
const connectDB = require("./config/db")
const { notFound, errorHandler } = require("./middleware/errorMiddleware")
const cors = require("cors")
const chatRouter = require("./router/chatRouter")
const messageRouter = require("./router/messageRouter")

const app = express()
connectDB()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use("/api/user", userRouter)
app.use("/api/chat", chatRouter)
app.use("/api/message", messageRouter)

app.use(notFound)
app.use(errorHandler)


app.listen(4000, console.log('SERVER STARTED'))