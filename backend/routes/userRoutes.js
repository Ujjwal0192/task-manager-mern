const express = require("express");

const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, deleteUser } = require("../controllers/userController");

const router = express.Router();

// GET /api/users          -> list users (admin only)
router.get("/", protect, adminOnly, getUsers);

// GET /api/users/:id      -> get single user (protected)
router.get("/:id", protect, getUserById);

// DELETE /api/users/:id   -> delete user (admin only)
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
