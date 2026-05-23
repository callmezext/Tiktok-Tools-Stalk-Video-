import mongoose from "mongoose";
import dns from "dns";

// Bypass local router/ISP DNS failures for MongoDB Atlas SRV lookups
if (process.env.MONGODB_URI?.startsWith("mongodb+srv://")) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    console.log("[RuneClipy] 🌐 Configured Google DNS (8.8.8.8) for MongoDB Atlas SRV resolution");
  } catch (dnsErr) {
    console.warn("[RuneClipy] ⚠️ Failed to set Google DNS servers:", dnsErr);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/runeclipy";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log("[RuneClipy] 🔌 Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("[RuneClipy] ✅ MongoDB connected successfully");
  } catch (e) {
    cached.promise = null;
    console.error("[RuneClipy] ❌ MongoDB connection failed:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
