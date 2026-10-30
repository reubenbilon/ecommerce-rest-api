 const express = require("express");
 const {register ,login} = require("../controllers/authController");
 const router = express.Router();

 //register new customer
 router.post("/register",register);

 //login existing user
router.post("/login",login);

module.exports = router;