// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error("MONGO_URI is NOT defined. Check .env file and its location.");
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB");
    console.error("Name   :", error.name);
    console.error("Message:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
