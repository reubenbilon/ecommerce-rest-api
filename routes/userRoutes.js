const express = require("express");
const router = express.Router();

const {getprofile,getAllusers,updateUserStatus} = require("../controllers/userConrtoller");
const {protect} = require("../middleware/auth")
const authorize = require("../middleware/authorize");

// Any logged-in user can view their own profile.
router.get("/profile",protect,getprofile);
// Only admins can manage users.
router.get("/",protect,authorize("admin"),getAllusers)
router.patch("/:id/status",protect,authorize("admin"),updateUserStatus)

module.exports = router;