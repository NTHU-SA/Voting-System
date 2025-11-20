import mongoose from "mongoose";

// Support both MONGODB_URI and individual parameters
function getMongoDBURI(): string {
  // If MONGODB_URI is provided, use it directly
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Otherwise, build URI from individual parameters
  const host = process.env.MONGO_HOST;
  const port = process.env.MONGO_PORT || "27017";
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const database = process.env.MONGO_NAME;

  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
}

const MONGODB_URI = getMongoDBURI();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections in the pool
      socketTimeoutMS: 45000, // Socket timeout
      serverSelectionTimeoutMS: 5000, // Server selection timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
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
