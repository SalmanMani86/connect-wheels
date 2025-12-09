import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb+srv://salmanhanif524_db_user:WP0vEbC3dILo75cE@my-chat-cluster.15d6lmo.mongodb.net/";

    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};
