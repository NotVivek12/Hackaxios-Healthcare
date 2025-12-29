import mongoose from 'mongoose';

// Define the mongoose connection cache
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Define the global type
declare global {
    var mongooseCache: MongooseCache | undefined;
}

// Initialize cached connection (do not read env or connect at import time)
const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        // Throw only when an actual connection is attempted without configuration
        throw new Error('MONGODB_URI is not configured');
    }

    if (!cached.promise) {
        const opts = { bufferCommands: false } as const;
        cached.promise = mongoose.connect(uri, opts).then((m) => m);
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;