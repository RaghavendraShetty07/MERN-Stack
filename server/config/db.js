import mongoose from 'mongoose';

let memoryServerInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Connected to MongoDB: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`[Database] Provided MONGODB_URI failed: ${err.message}. Checking fallback...`);
    }
  }

  // Try default localhost mongodb first
  try {
    const localUri = 'mongodb://127.0.0.1:27017/smartq_campus';
    console.log(`[Database] Trying local MongoDB at: ${localUri}`);
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Connected to local MongoDB: ${conn.connection.host}`);
    return;
  } catch (localErr) {
    console.log('[Database] Local MongoDB not running. Starting high-speed embedded In-Memory MongoDB Server...');
  }

  // Fallback to embedded In-Memory MongoDB (MongoMemoryServer)
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    await mongoose.connect(memUri);
    console.log(`[Database] Connected to Embedded In-Memory MongoDB! (Zero-config ready)`);
  } catch (memErr) {
    console.error(`[Database] Failed to start In-Memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};
