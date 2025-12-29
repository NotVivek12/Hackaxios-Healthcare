import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'net';

export interface ServerIO extends NetServer {
    io?: SocketIOServer;
}

// Extend Socket with our IO server
export interface SocketWithIO extends Socket {
    server: ServerIO;
}

// Custom NextApiResponse type with our socket extension
// Using type instead of interface to avoid inheritance issues
export type NextApiResponseServerIO = NextApiResponse & {
    socket: SocketWithIO;
}

export interface UserConnection {
    userId: string;
    socketId: string;
}

export interface ConsultationRoom {
    roomId: string;
    participants: UserConnection[];
}

export interface ChatMessage {
    roomId: string;
    message: string;
    sender: string;
    timestamp: Date;
}

export interface SignalData {
    userId: string;
    roomId: string;
    signal: unknown; // WebRTC signaling data
}
