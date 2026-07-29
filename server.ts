/**
 * Custom Next.js Server with Socket.io for Real-time Collaboration
 * Runs both Next.js and WebSocket server on port 3000
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { createRoomStorage } from './src/lib/collab/room-storage';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Ensure .next directory exists and has required manifest files
function ensureNextManifests() {
  const nextDir = join(process.cwd(), '.next');
  
  // Create .next directory if it doesn't exist
  if (!existsSync(nextDir)) {
    mkdirSync(nextDir, { recursive: true });
  }
  
  // Create routes-manifest.json if it doesn't exist (required by Next.js)
  const routesManifestPath = join(nextDir, 'routes-manifest.json');
  if (!existsSync(routesManifestPath)) {
    const defaultManifest = {
      version: 3,
      pages404: true,
      basePath: '',
      redirects: [],
      rewrites: [],
      headers: [],
      dynamicRoutes: [],
      dataRoutes: [],
      i18n: undefined,
    };
    writeFileSync(routesManifestPath, JSON.stringify(defaultManifest, null, 2));
    console.log('[Server] Created missing routes-manifest.json');
  }
}

// Ensure manifests exist before initializing Next.js
ensureNextManifests();

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room data storage (Redis in production, in-memory for development)
const roomStorage = createRoomStorage();

// Generate random color for user cursor
function generateUserColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF4500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : [process.env.NEXT_PUBLIC_APP_URL || '*'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);
    
    let currentRoom: string | null = null;
    let username: string = 'Anonymous';
    let userColor: string = generateUserColor();

    // Initialize room
    socket.on('init-room', () => {
      socket.emit('init-room');
    });

    // Join room
    socket.on('join-room', async (roomId: string) => {
      if (currentRoom) {
        socket.leave(currentRoom);
      }
      
      currentRoom = roomId;
      socket.join(roomId);
      
      // Add user to room storage
      await roomStorage.addUser(roomId, socket.id, {
        socketId: socket.id,
        username,
        color: userColor,
      });
      
      // Notify others
      socket.to(roomId).emit('new-user', socket.id);
      
      // Send current users to the new user
      const users = await roomStorage.getUsers(roomId);
      const clients = users.map(u => u.socketId);
      io.to(roomId).emit('room-user-change', clients);
      
      console.log(`[WS] ${socket.id} joined room ${roomId} (${users.length} users)`);
    });

    // Handle encrypted scene data (SERVER event)
    socket.on('server-broadcast', (roomId: string, encryptedBuffer: ArrayBuffer, iv: Uint8Array) => {
      if (currentRoom !== roomId) return;
      
      // Broadcast to all other clients in the room
      socket.to(roomId).emit('client-broadcast', roomId, encryptedBuffer, iv);
    });

    // Handle volatile (real-time) data like cursor positions
    socket.on('server-volatile-broadcast', (roomId: string, encryptedBuffer: ArrayBuffer, iv: Uint8Array) => {
      if (currentRoom !== roomId) return;
      
      // Volatile emit for cursor updates (can be dropped if network is congested)
      socket.volatile.to(roomId).emit('client-broadcast', roomId, encryptedBuffer, iv);
    });

    // Update username
    socket.on('update-username', async (newUsername: string) => {
      username = newUsername || 'Anonymous';
      
      if (currentRoom) {
        await roomStorage.addUser(currentRoom, socket.id, {
          socketId: socket.id,
          username,
          color: userColor,
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
      
      if (currentRoom) {
        // Remove user from room storage
        await roomStorage.removeUser(currentRoom, socket.id);
        
        // Notify others
        socket.to(currentRoom).emit('user-left', socket.id);
        
        const users = await roomStorage.getUsers(currentRoom);
        const clients = users.map(u => u.socketId);
        io.to(currentRoom).emit('room-user-change', clients);
        
        // Clean up empty rooms after a delay
        if (users.length === 0) {
          setTimeout(async () => {
            const currentUsers = await roomStorage.getUsers(currentRoom!);
            if (currentUsers.length === 0) {
              await roomStorage.deleteRoom(currentRoom!);
              console.log(`[WS] Room ${currentRoom} deleted (empty)`);
            }
          }, 60000); // 1 minute delay
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`[WS] Socket error for ${socket.id}:`, error);
    });
  });

  // Periodic cleanup of old rooms (24 hours)
  setInterval(async () => {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cleaned = await roomStorage.cleanup(maxAge);
    if (cleaned > 0) {
      console.log(`[WS] Cleaned up ${cleaned} expired rooms`);
    }
  }, 60 * 60 * 1000); // Check every hour

  // Start server
  httpServer.listen(port, () => {
    console.log(`
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   🚀 Server ready on http://${hostname}:${port}       │
  │                                                 │
  │   📱 Next.js App:     http://${hostname}:${port}       │
  │   🔌 WebSocket:       ws://${hostname}:${port}         │
  │   🤝 Collaboration:   Enabled                   │
  │                                                 │
  └─────────────────────────────────────────────────┘
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });
});

