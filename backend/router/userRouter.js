const express = require("express")
const { registerUser, loginUser, allUsers } = require("../controller/userController")
const {protect} = require('../middleware/authMiddleware')

router = express.Router()



// Register Route domain/api/user
router.route("/").post(registerUser).get(protect, allUsers);
router.route("/login").post(loginUser)





module.exports = router