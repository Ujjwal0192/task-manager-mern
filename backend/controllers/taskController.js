const mongoose = require("mongoose");
const Task = require("../models/Task");


// Validate ObjectId
const isValidId = (id) => mongoose.isValidObjectId(id);

// Check if a user is admin or the creator of the task.
// Supports createdBy being array or single id.
const userIsCreatorOrAdmin = (task, user) => {
  if (!task || !user) return false;
  if (user.role === "admin") return true;

  // createdBy might be array or single ref
  const createdBy = task.createdBy;
  if (Array.isArray(createdBy)) {
    return createdBy.some((cid) => cid && cid.toString() === user._id.toString());
  }
  if (createdBy && createdBy.toString) {
    return createdBy.toString() === user._id.toString();
  }
  return false;
};

// Allowed status set (single source of truth)
const ALLOWED_STATUSES = ["Pending", "In Progress", "Completed"];


 // GET /api/tasks
 // - Admin: returns all tasks (optionally filtered by status)
 // - Non-admin: returns tasks assigned to the logged-in user

const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      // Accept only allowed statuses to avoid injection / nonsense
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = status;
    }

    // Non-admin users must be authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build queries depending on role
    const isAdmin = req.user.role === "admin";
    const findFilter = isAdmin ? filter : { ...filter, assignedTo: req.user._id };

    // Fetch tasks with populated assignedTo (name/email/profileImageUrl)
    const tasks = await Task.find(findFilter)
      .populate("assignedTo", "name email profileImageUrl")
      .lean();

    // Compute completed todo checklist count for each task (defensive)
    const tasksWithCounts = tasks.map((task) => {
      const checklist = Array.isArray(task.todoChecklist) ? task.todoChecklist : [];
      const completedTodoCount = checklist.filter((item) => item && item.completed).length;
      return { ...task, completedTodoCount };
    });

    // Compute counts (respecting filter & role)
    const baseFilter = isAdmin ? {} : { assignedTo: req.user._id };
    const countFilters = {
      all: { ...baseFilter, ...filter },
      pending: { ...baseFilter, ...filter, status: "Pending" },
      inProgress: { ...baseFilter, ...filter, status: "In Progress" },
      completed: { ...baseFilter, ...filter, status: "Completed" },
    };

    const [allCount, pendingCount, inProgressCount, completedCount] = await Promise.all([
      Task.countDocuments(countFilters.all),
      Task.countDocuments(countFilters.pending),
      Task.countDocuments(countFilters.inProgress),
      Task.countDocuments(countFilters.completed),
    ]);

    res.json({
      tasks: tasksWithCounts,
      statusSummary: {
        all: allCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    console.error("getTasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/tasks/:id
 * Returns a single task with populated assignedTo and computed completedTodoCount
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id)
      .populate("assignedTo", "name email profileImageUrl")
      .lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    const checklist = Array.isArray(task.todoChecklist) ? task.todoChecklist : [];
    const completedTodoCount = checklist.filter((i) => i && i.completed).length;

    return res.json({ ...task, completedTodoCount });
  } catch (error) {
    console.error("getTaskById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * POST /api/tasks
 * Create a task. `assignedTo` should be an array of user IDs (optional).
 * This preserves your existing behavior and schema expectations.
 */
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (assignedTo && !Array.isArray(assignedTo)) {
      return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo: assignedTo || [],
      // keep createdBy as array to match schema used elsewhere
      createdBy: req.user && req.user._id ? [req.user._id] : [],
      todoChecklist: Array.isArray(todoChecklist) ? todoChecklist : [],
      attachments: attachments || [],
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("createTask error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * PUT /api/tasks/:id
 * Partial update allowed. Only admin or creator can update.
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!userIsCreatorOrAdmin(task, req.user)) {
      return res.status(403).json({ message: "Forbidden: cannot update this task" });
    }

    const allowed = [
      "title",
      "description",
      "priority",
      "dueDate",
      "assignedTo",
      "attachments",
      "todoChecklist",
      "progress",
      "status",
    ];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (key === "assignedTo" && req.body.assignedTo && !Array.isArray(req.body.assignedTo)) {
          // ignore invalid assignedTo
        } else {
          task[key] = req.body[key];
        }
      }
    });

    await task.save();
    return res.json({ message: "Task updated", task });
  } catch (error) {
    console.error("updateTask error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * DELETE /api/tasks/:id
 * Admin or creator can delete
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!userIsCreatorOrAdmin(task, req.user)) {
      return res.status(403).json({ message: "Forbidden: cannot delete this task" });
    }

    await Task.deleteOne({ _id: id });
    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * PUT /api/tasks/:id/status
 * Body: { status: "Pending" | "In Progress" | "Completed" }
 * Any assigned user or admin can update status
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task id" });
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid or missing status" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(a => a.toString() === req.user._id.toString());
    if (!(req.user && (req.user.role === "admin" || isAssigned || userIsCreatorOrAdmin(task, req.user)))) {
      return res.status(403).json({ message: "Forbidden: cannot update status" });
    }

    task.status = status;
    if (status === "Completed") task.progress = 100;
    await task.save();

    return res.json({ message: "Status updated", task });
  } catch (error) {
    console.error("updateTaskStatus error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(a => a.toString() === req.user._id.toString());
    if (!(req.user && (req.user.role === "admin" || isAssigned || userIsCreatorOrAdmin(task, req.user)))) {
      return res.status(403).json({ message: "Forbidden: cannot update checklist" });
    }

    if (req.body.todoChecklist && Array.isArray(req.body.todoChecklist)) {
      const cleaned = req.body.todoChecklist.map((it) => ({ text: it.text || "", completed: !!it.completed }));
      task.todoChecklist = cleaned;
      await task.save();
      return res.json({ message: "Checklist replaced", task });
    }

    const { itemIndex, completed } = req.body;
    if (typeof itemIndex === "number") {
      const checklist = Array.isArray(task.todoChecklist) ? task.todoChecklist : [];
      if (itemIndex < 0 || itemIndex >= checklist.length) {
        return res.status(400).json({ message: "Invalid itemIndex" });
      }
      checklist[itemIndex].completed = !!completed;
      task.todoChecklist = checklist;
      await task.save();
      return res.json({ message: "Checklist item updated", task });
    }

    return res.status(400).json({ message: "Invalid payload. Send todoChecklist array or itemIndex + completed" });
  } catch (error) {
    console.error("updateTaskChecklist error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getDashboardData = async (req, res) => {
  try {
    // admin only
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admin only" });
    }

    // allow override of recent limit via ?limit=5 etc.
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments({}),
      Task.countDocuments({ status: "Pending" }),
      Task.countDocuments({ status: "In Progress" }),
      Task.countDocuments({ status: "Completed" })
    ]);

    const recent = await Task.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title description priority status assignedTo createdBy createdAt updatedAt")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();

    return res.json({
      counts: { total, pending, inProgress, completed },
      recent
    });
  } catch (error) {
    console.error("getDashboardData error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getUserDashboardData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user._id;

    const [assignedCount, pendingCount, inProgressCount, completedCount] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: "Pending" }),
      Task.countDocuments({ assignedTo: userId, status: "In Progress" }),
      Task.countDocuments({ assignedTo: userId, status: "Completed" })
    ]);

    const upcoming = await Task.find({
      assignedTo: userId,
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ dueDate: 1 })
    .limit(10)
    .select("title dueDate status assignedTo")
    .lean();

    return res.json({
      counts: {
        assigned: assignedCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount
      },
      upcoming
    });
  } catch (error) {
    console.error("getUserDashboardData error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
