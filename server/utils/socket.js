import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows local dev across ports 5173/3000/etc
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware (SRS Sec 10)
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      // Allow public kiosk / display connection without full auth if requested
      if (socket.handshake.query?.clientType === 'public_display') {
        socket.data.user = { role: 'display', name: 'Campus Display Kiosk' };
        return next();
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'smartq_campus_jwt_secret_dev_key_2026'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not active or not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userRole = socket.data?.user?.role || 'anonymous';
    // Join room for specific service
    socket.on('join:service', (serviceId) => {
      if (serviceId) {
        const roomName = `service:${serviceId}`;
        socket.join(roomName);
      }
    });

    socket.on('leave:service', (serviceId) => {
      if (serviceId) {
        const roomName = `service:${serviceId}`;
        socket.leave(roomName);
      }
    });

    // Join room for public display
    socket.on('join:display', () => {
      socket.join('campus:display');
    });

    socket.on('leave:display', () => {
      socket.leave('campus:display');
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};

/**
 * Broadcasts queue:updated event to service room and campus display
 */
export const emitQueueUpdated = (serviceId, eventType, data = {}) => {
  if (!ioInstance) return;

  const payload = {
    serviceId: String(serviceId),
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Broadcast to service room
  ioInstance.to(`service:${serviceId}`).emit('queue:updated', payload);
  // Also broadcast to campus display
  ioInstance.to('campus:display').emit('queue:updated', payload);

  // If token was called, emit dedicated token:called event for live audio chime
  if (eventType === 'called' && data.tokenNumber) {
    ioInstance.to(`service:${serviceId}`).emit('token:called', payload);
    ioInstance.to('campus:display').emit('token:called', payload);
  }
};
