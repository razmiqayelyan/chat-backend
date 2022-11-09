const express = require("express")
const { registerUser, loginUser, allUsers, userInfo, editProfile } = require("../controller/userController")
const {protect} = require('../middleware/authMiddleware')

router = express.Router()



// Register Route domain/api/user
router.route("/").post(registerUser).get(protect, allUsers).put(protect, editProfile);
router.route("/login").post(loginUser)
router.route("/verify").post(protect, userInfo)





module.exports = router