const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");


const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    // default: show members only if not admin filter requested
    if (!req.query.role) filter.role = "member";

    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password -__v")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // attach task counts per user
    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const [pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
          Task.countDocuments({ assignedTo: user._id, status: "Pending" }),
          Task.countDocuments({ assignedTo: user._id, status: "In Progress" }),
          Task.countDocuments({ assignedTo: user._id, status: "Completed" })
        ]);

        return {
          ...user,
          pendingTasks,
          inProgressTasks,
          completedTasks
        };
      })
    );

    res.json({
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      data: userWithTaskCounts
    });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password -__v").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // counts
    const [pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: user._id, status: "Pending" }),
      Task.countDocuments({ assignedTo: user._id, status: "In Progress" }),
      Task.countDocuments({ assignedTo: user._id, status: "Completed" })
    ]);

    res.json({ ...user, pendingTasks, inProgressTasks, completedTasks });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deleting other admins by mistake (optional policy)
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    await User.deleteOne({ _id: id });

    // Optionally: cleanup tasks assigned to this user or reassign them
    // await Task.updateMany({ assignedTo: id }, { assignedTo: null });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getUsers, getUserById, deleteUser };
