// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// middleware to protect routes
const protect = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || req.get("authorization") || "";
    // quick debug log (uncomment while debugging)
//    console.log('protect raw auth header:', raw);

    if (!raw || typeof raw !== "string" || !raw.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorised, no token" });
    }

    const token = raw.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Not authorised, token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token failed", error: err.message });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token invalid" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorised, user not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("protect middleware error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// middleware for Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorised" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  return next();
};

module.exports = { protect, adminOnly };
