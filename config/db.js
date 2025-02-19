const mongoose = require('mongoose');
const config = require('config');
require('dotenv').config();

// Custom logger for development
const log = (message, type = 'info') => {
  if (process.env.NODE_ENV !== 'production') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${icons[type]} ${message}`);
  }
};

const getMongoURI = () => {
  try {
    // Prioritize environment variable over config file
    return process.env.MONGO_URI || config.get('mongoURI');
  } catch (err) {
    log('Failed to get MongoDB URI', 'error');
    throw new Error('MongoDB URI is not defined in environment variables or config');
  }
};

const connectDB = async () => {
  try {
    const db = getMongoURI();
    
    // Remove deprecated options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      family: 4 // Use IPv4, skip trying IPv6
    };

    mongoose.connection.on('connecting', () => {
      log('Connecting to MongoDB...', 'info');
    });

    mongoose.connection.on('connected', () => {
      log('MongoDB Connected Successfully', 'success');
    });

    mongoose.connection.on('error', (err) => {
      log(`MongoDB Connection Error: ${err.message}`, 'error');
    });

    mongoose.connection.on('disconnected', () => {
      log('MongoDB Disconnected', 'warning');
    });

    // Connect with mongoose
    await mongoose.connect(db, options);

    // Add indexes in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

  } catch (err) {
    log(`MongoDB Connection Error: ${err.message}`, 'error');
    // Exit process with failure
    process.exit(1);
  }
};

// Clean up connection on app termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    log('MongoDB connection closed through app termination', 'info');
    process.exit(0);
  } catch (err) {
    log(`Error during connection closure: ${err.message}`, 'error');
    process.exit(1);
  }
});

module.exports = connectDB;