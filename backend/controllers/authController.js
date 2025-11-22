// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require("../config/cloudinary");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set in .env — tokens will fail.');
}

// generate jwt
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // upload to Cloudinary from buffer
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "taskmanager/profile_pics", // you can customize folder
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res
            .status(500)
            .json({ message: "Image upload failed", error: error.message });
        }

    
        return res.status(200).json({
          imageUrl: result.secure_url, // Cloudinary URL
          publicId: result.public_id,
        });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("uploadProfileImage error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const registerUser = async (req, res) => {
  try {

  

    const { name, email, password, profileImageUrl, adminInviteToken } = req.body;
    

    if (!name || !email.trim().toLowerCase() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    console.time('db:findUserByEmail');
    const userExisted = await User.findOne({ email });
    console.timeEnd('db:findUserByEmail');

    if (userExisted) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let role = 'member';
    if (adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
      role = 'admin';
    }

    // hash password (bcrypt genSalt + hash)
    console.time('bcrypt:hash');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.timeEnd('bcrypt:hash');

    console.time('db:createUser');
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
      role,
    });
    console.timeEnd('db:createUser');

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    


    if (!req.body) {
      return res.status(400).json({ message: 'No request body. Set Content-Type: application/json' });
    }

    // normalize email to avoid case-sensitivity issues
    let { email, password } = req.body || {};
    if (email && typeof email === 'string') email = email.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.time('db:findUserForLogin');
    const user = await User.findOne({ email }).exec();
    console.timeEnd('db:findUserForLogin');

    if (!user) {
      console.warn(`login failed - user not found: ${email}`);
      // Generic message for security
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('login failed - user has no password stored:', user._id);
      return res.status(500).json({ message: 'User record invalid (no password). Contact admin.' });
    }

    console.time('bcrypt:compare');
    const match = await bcrypt.compare(password, user.password);
    console.timeEnd('bcrypt:compare');

    if (!match) {
      console.warn('login failed - wrong password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // everything ok - return token
    const token = generateToken(user._id);
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token
    });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getUserProfile = async (req, res) => {
  try {
    // protect middleware should set req.user = { id: ... } or similar
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    console.time('db:findUserById');
    const user = await User.findById(userId).select('-password');
    console.timeEnd('db:findUserById');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('getUserProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    console.time('db:findUserToUpdate');
    const user = await User.findById(userId);
    console.timeEnd('db:findUserToUpdate');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Allow partial updates
    const { name, email, password, profileImageUrl } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof profileImageUrl !== 'undefined') user.profileImageUrl = profileImageUrl;

    if (password) {
      console.time('bcrypt:hashUpdate');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      console.timeEnd('bcrypt:hashUpdate');
    }

    console.time('db:saveUser');
    const updated = await user.save();
    console.timeEnd('db:saveUser');

    const safeUser = {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      profileImageUrl: updated.profileImageUrl,
    };

    res.json(safeUser);
  } catch (error) {
    console.error('updateUserProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { uploadProfileImage,registerUser, loginUser, getUserProfile, updateUserProfile };
