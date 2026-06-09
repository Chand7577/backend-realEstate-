const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME,
      // The options below are no longer necessary in Mongoose 6+, but good for clarity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Note: To use ACID transactions, the connected MongoDB instance MUST be a replica set.
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
