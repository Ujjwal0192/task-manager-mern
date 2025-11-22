const express = require("express");
const multer = require("multer");
const {registerUser,loginUser,getUserProfile,updateUserProfile} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

const { uploadProfileImage } = require("../controllers/authController");

// use memory storage (no local file saving needed)
const upload = multer({ storage: multer.memoryStorage() });


const router = express.Router();

router.post("/register",registerUser); //register user
router.post("/login",loginUser); //loginn user
router.get("/profile",protect,getUserProfile); //get user profile 
router.put("/profile",protect,updateUserProfile); // update  user profile 

// upload image route
router.post("/upload-image", upload.single("image"), uploadProfileImage);

module.exports = router;