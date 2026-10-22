import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { playCallChime } from '../utils/sound';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastQueueEvent, setLastQueueEvent] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundRef = useRef(soundEnabled);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    // Only connect if there is a token (or for public display mode)
    const socketInstance = io(window.location.origin, {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('queue:updated', (data) => {
      setLastQueueEvent(data);
    });

    socketInstance.on('token:called', (data) => {
      if (soundRef.current) {
        playCallChime();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const joinService = (serviceId) => {
    if (socket && serviceId) {
      socket.emit('join:service', serviceId);
    }
  };

  const leaveService = (serviceId) => {
    if (socket && serviceId) {
      socket.emit('leave:service', serviceId);
    }
  };

  const joinDisplay = () => {
    if (socket) {
      socket.emit('join:display');
    }
  };

  const leaveDisplay = () => {
    if (socket) {
      socket.emit('leave:display');
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastQueueEvent,
        joinService,
        leaveService,
        joinDisplay,
        leaveDisplay,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
