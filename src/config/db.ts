// src/config/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/medflow-ai";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
    });
    console.log("📦 Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.error(
      "💡 Tip: If you're on WARP, VPN, or a restrictive network, try switching to a different network or hotspot."
    );
    process.exit(1);
  }
};

export default connectDB;
