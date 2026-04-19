import mongoose from "mongoose";

function getMongoDBURI(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const database = process.env.MONGO_DATABASE;
  const host = process.env.MONGO_HOST || "localhost";
  const port = process.env.MONGO_PORT || "27017";

  if (username && password && database) {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return `mongodb://${encodedUser}:${encodedPass}@${host}:${port}/${database}?authSource=admin`;
  }

  if (process.env.CI || process.env.npm_lifecycle_event === "build") {
    console.warn("Compile-time environment detected, using mock MongoDB URI.");
    return "mongodb://mock-uri:27017/mock";
  }

  throw new Error(
    "Unable to get MongoDB connection string! Please ensure .env provides MONGODB_URI or related database variables.",
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
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
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    };

    const uri = getMongoDBURI();
    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // 連線失敗的話，清除 Promise 以便下次重試
    console.error("MongoDB connection failed:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
