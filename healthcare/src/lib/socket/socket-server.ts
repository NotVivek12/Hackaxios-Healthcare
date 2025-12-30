import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';

let io: SocketIOServer | null = null;

// Store user socket mappings for notifications
const userSockets: Map<string, string[]> = new Map();

export function initSocketServer(server: NetServer) {
    if (!io) {
        console.log('Setting up socket.io server...');

        // Create a new Socket.io server
        io = new SocketIOServer(server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Define socket event handlers
        io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.id}`);

            // Register user for notifications
            socket.on('register-user', (userId: string) => {
                console.log(`User ${userId} registered for notifications`);
                const existingSockets = userSockets.get(userId) || [];
                existingSockets.push(socket.id);
                userSockets.set(userId, existingSockets);
                socket.join(`user:${userId}`);
            });

            // Join a room (meeting)
            socket.on('join-room', (roomId: string, userId: string) => {
                console.log(`User ${userId} joined room ${roomId}`);
                socket.join(roomId);
                socket.to(roomId).emit('user-connected', userId);

                // Handle disconnection
                socket.on('disconnect', () => {
                    console.log(`User ${userId} left room ${roomId}`);
                    socket.to(roomId).emit('user-disconnected', userId);
                    
                    // Clean up user socket mapping
                    const sockets = userSockets.get(userId) || [];
                    const updatedSockets = sockets.filter(s => s !== socket.id);
                    if (updatedSockets.length > 0) {
                        userSockets.set(userId, updatedSockets);
                    } else {
                        userSockets.delete(userId);
                    }
                });
            });

            // Handle signaling events
            socket.on('signal', (data: { userId: string, roomId: string, signal: unknown }) => {
                const { userId, roomId, signal } = data;
                console.log(`Signal from ${userId} in room ${roomId}`);
                socket.to(roomId).emit('signal', { userId, signal });
            });

            // Handle chat messages
            socket.on('send-message', (data: { 
                roomId: string, 
                message: string, 
                sender: string,
                senderName?: string,
                senderRole?: string 
            }) => {
                const { roomId, message, sender, senderName, senderRole } = data;
                console.log(`Message in room ${roomId} from ${sender}`);
                io?.to(roomId).emit('receive-message', { 
                    message, 
                    sender, 
                    senderName,
                    senderRole,
                    timestamp: new Date() 
                });
            });

            // Handle general disconnect
            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    return io;
}

export function getSocketServer() {
    return io;
}

// Send notification to a specific user
export function sendNotificationToUser(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
}) {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
    }
}

// Broadcast to a meeting room
export function broadcastToRoom(roomId: string, event: string, data: unknown) {
    if (io) {
        io.to(roomId).emit(event, data);
    }
}
