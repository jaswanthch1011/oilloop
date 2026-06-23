// db.js – Mongoose connection setup for FryToFly backend
// Load environment variables (Node.js 14+ supports import of dotenv)
// db.js – Mongoose connection setup for FryToFly backend (CommonJS)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not defined in .env');
  process.exit(1);
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 */
async function connectDB() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectDB, mongoose };

// db.js – Mongoose connection setup for FryToFly backend (ES module)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not defined in .env');
  process.exit(1);
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 * The connection uses the "retryWrites=true&w=majority" options for reliability.
 */
export async function connectDB() {
  try {
    await mongoose.connect(mongoUri, {
      // Options to avoid deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optional: set a reasonable connection timeout
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Export mongoose for model definitions
export { mongoose };


const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not defined in .env');
  process.exit(1);
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 * The connection uses the "retryWrites=true&w=majority" options for reliability.
 */
async function connectDB() {
  try {
    await mongoose.connect(mongoUri, {
      // Options to avoid deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optional: set a reasonable connection timeout
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectDB, mongoose };
