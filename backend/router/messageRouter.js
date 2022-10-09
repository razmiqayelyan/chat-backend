const express = require('express')
const { sendMessage } = require('../controller/messageController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.route("/").post(protect, sendMessage)

module.exports = router