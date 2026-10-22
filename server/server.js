import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './utils/socket.js';
import { seedDatabase } from './seed/seeder.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import queueRoutes from './routes/queueRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
const io = initSocket(server);

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes (SRS Sec 8)
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);

// 404 Catch-all handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handler (SRS Sec 8: Never leak stack traces or secrets; consistent { message: '...' })
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred',
  });
});

const PORT = process.env.PORT || 5000;

// Start Server & Connect to DB
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` SmartQ Campus Backend Server Running!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Socket.IO: Activated`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
