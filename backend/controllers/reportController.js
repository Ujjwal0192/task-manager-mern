// controllers/reportController.js
const ExcelJS = require('exceljs');
const Task = require('../models/Task');
const User = require('../models/User');

const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'name email').lean();

    // create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');

    worksheet.columns = [
      { header: 'Task ID', key: '_id', width: 24 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Assigned To', key: 'assignedTo', width: 40 },
    ];

    tasks.forEach((task) => {
      const assignedArr = Array.isArray(task.assignedTo) ? task.assignedTo : [];
      const assignedTo = assignedArr.length
        ? assignedArr.map((u) => `${u.name || 'Unknown'} (${u.email || 'no-email'})`).join(', ')
        : 'Unassigned';

      // format dueDate safely
      let due = '';
      if (task.dueDate) {
        try {
          // If dueDate is a Date or ISO string, produce YYYY-MM-DD
          const d = new Date(task.dueDate);
          if (!isNaN(d)) due = d.toISOString().slice(0, 10);
        } catch (e) {
          due = String(task.dueDate);
        }
      }

      worksheet.addRow({
        _id: task._id?.toString?.() || '',
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || '',
        status: task.status || '',
        dueDate: due,
        assignedTo,
      });
    });

    // set response headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks_report.xlsx"');

    // stream workbook to response and end
    await workbook.xlsx.write(res);
    res.end();
    return; // important: don't fall through to any other response
  } catch (error) {
    console.error('exportTasksReport error:', error);
    return res.status(500).json({ message: 'Error generating tasks report', error: error.message });
  }
};

const exportUserReport = async (req, res) => {
  try {
    const users = await User.find().select('name email role').lean();

    // Create a small workbook for users too (optional: keep as JSON if you prefer)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users Report');

    worksheet.columns = [
      { header: 'User ID', key: '_id', width: 24 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'Role', key: 'role', width: 16 },
    ];

    users.forEach((u) => {
      worksheet.addRow({
        _id: u._id?.toString?.() || '',
        name: u.name || '',
        email: u.email || '',
        role: u.role || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="users_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
    return;
  } catch (error) {
    console.error('exportUserReport error:', error);
    return res.status(500).json({ message: 'Error generating users report', error: error.message });
  }
};

module.exports = {
  exportTasksReport,
  exportUserReport,
};
