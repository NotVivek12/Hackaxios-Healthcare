import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function SocketHandler(
    req: NextApiRequest,
    res: NextApiResponseServerIO
) {
    if (!res.socket.server.io) {
        console.log('Setting up socket.io server...');

        // Create a new Socket.io server
        const httpServer: NetServer = res.socket.server as unknown as NetServer;
        const io = new SocketIOServer(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        // Store the Socket.io server instance
        res.socket.server.io = io;

        // Define socket event handlers
        io.on('connection', (socket) => {
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
            socket.on('signal', ({ userId, roomId, signal }) => {
                console.log(`Signal from ${userId} in room ${roomId}`);
                socket.to(roomId).emit('signal', { userId, signal });
            });

            // Handle chat messages
            socket.on('send-message', ({ roomId, message, sender }) => {
                console.log(`Message in room ${roomId} from ${sender}`);
                io.to(roomId).emit('receive-message', { message, sender });
            });
        });
    }

    res.end();
}
