require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const imageRoutes =require("./routes/imageRoutes");

const app = express();

// body parsers (must be before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files (if you use uploads/)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS (keep before routes)
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// connect DB
connectDB();

// routes (mount with RESTful names)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks',taskRoutes);
app.use('/api/reports', reportRoutes);

app.use('/uploads',imageRoutes );

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
