import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { isOriginAllowed } from '../utils/originHelper.js';

import jwt from 'jsonwebtoken';

let ioInstance = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

export function initSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  // Socket middleware for user authentication
  io.use(async (socket, next) => {
    try {
      let sessionToken = socket.handshake.auth?.token;
      if (!sessionToken && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        sessionToken = socket.handshake.headers.authorization.slice(7).trim();
      }

      if (!sessionToken && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(new RegExp(`${env.SESSION_COOKIE_NAME}=([^;]+)`));
        if (match) {
          sessionToken = match[1];
        }
      }

      if (sessionToken) {
        let decoded = null;
        try {
          decoded = jwt.verify(sessionToken, env.SESSION_SECRET);
        } catch {
          decoded = jwt.decode(sessionToken);
        }

        const uid = decoded?.uid || decoded?.sub || decoded?.user_id;
        if (uid) {
          const user = await User.findOne({ firebaseUid: uid }).select('_id challenge.nickname showOnlineStatus');
          if (user) {
            socket.user = user;
          }
        }
      }
      next();
    } catch (err) {
      console.warn('[Socket.io] Auth middleware note:', err);
      next();
    }
  });

  io.on('connection', (socket) => {
    let currentUserId = socket.user?._id?.toString() || socket.handshake.query?.userId;

    if (currentUserId) {
      socket.join(`user_${currentUserId}`);
      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Broadcast subtle online indicator
      if (socket.user?.showOnlineStatus !== false) {
        io.emit('user_online', { userId: currentUserId, status: 'online' });
      }
    }

    // Allow client to register user ID after authentication
    socket.on('register_user', (regUserId) => {
      if (regUserId) {
        const uId = regUserId.toString();
        currentUserId = uId;
        socket.join(`user_${uId}`);
        if (!onlineUsers.has(uId)) {
          onlineUsers.set(uId, new Set());
        }
        onlineUsers.get(uId).add(socket.id);
        io.emit('user_online', { userId: uId, status: 'online' });
      }
    });

    // Join 1:1 conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(conversationId.toString());
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(conversationId.toString());
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit('user_typing', {
          conversationId,
          userId: currentUserId,
          isTyping
        });
      }
    });

    // Message read receipt
    socket.on('message_read', ({ conversationId, messageId }) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit('message_read_receipt', {
          conversationId,
          messageId,
          readAt: new Date()
        });
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.get(currentUserId).delete(socket.id);
        if (onlineUsers.get(currentUserId).size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('user_offline', { userId: currentUserId, status: 'offline' });
        }
      }
    });
  });

  return io;
}

export function getSocketIO() {
  return ioInstance;
}
