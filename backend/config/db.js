const path = require('path');
const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';

  // 1. Try connecting to configured URI (local or Atlas) with a 2.5s timeout
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
    return;
  } catch (err) {
    console.warn(`[MongoDB] External MongoDB at ${uri} not reached (${err.message}).`);
    console.log('[MongoDB] Initializing local embedded MongoDB instance...');
  }

  // 2. Launch MongoMemoryServer with local cached binary in workspace
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const cacheDir = path.resolve(__dirname, '../../tools/mongo-cache');

    process.env.MONGOMS_DOWNLOAD_DIR = cacheDir;

    mongodInstance = await MongoMemoryServer.create({
      binary: {
        downloadDir: cacheDir
      },
      instance: {
        dbName: 'imovies'
      }
    });

    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected successfully to local embedded MongoDB at: ${memoryUri}`);
  } catch (memoryErr) {
    console.error(`[MongoDB] Embedded MongoDB start failed: ${memoryErr.message}`);
    throw memoryErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
