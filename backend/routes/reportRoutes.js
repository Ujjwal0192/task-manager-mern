const express = require('express');
const { exportTasksReport, exportUserReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middlewares/authMiddleware'); // 👈 include protect
const router = express.Router();

router.get("/export/tasks", protect, adminOnly, exportTasksReport);
router.get("/export/users", protect, adminOnly, exportUserReport);

module.exports = router;
