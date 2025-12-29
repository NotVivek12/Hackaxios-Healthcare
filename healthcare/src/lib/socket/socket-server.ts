import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketServer(server: NetServer) {
    if (!io) {
        console.log('Setting up socket.io server...');

        // Create a new Socket.io server
        io = new SocketIOServer(server, {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        // Define socket event handlers
        io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.id}`);

            // Join a room (consultation)
            socket.on('join-room', (roomId: string, userId: string) => {
                console.log(`User ${userId} joined room ${roomId}`);
                socket.join(roomId);
                socket.to(roomId).emit('user-connected', userId);

                // Handle disconnection
                socket.on('disconnect', () => {
                    console.log(`User ${userId} left room ${roomId}`);
                    socket.to(roomId).emit('user-disconnected', userId);
                });
            });

            // Handle signaling events
            socket.on('signal', (data: { userId: string, roomId: string, signal: unknown }) => {
                const { userId, roomId, signal } = data;
                console.log(`Signal from ${userId} in room ${roomId}`);
                socket.to(roomId).emit('signal', { userId, signal });
            });

            // Handle chat messages
            socket.on('send-message', (data: { roomId: string, message: string, sender: string }) => {
                const { roomId, message, sender } = data;
                console.log(`Message in room ${roomId} from ${sender}`);
                io?.to(roomId).emit('receive-message', { message, sender, timestamp: new Date() });
            });
        });
    }

    return io;
}

export function getSocketServer() {
    return io;
}
