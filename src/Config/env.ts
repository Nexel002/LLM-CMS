import dotenv from "dotenv";

dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || "",
  dbName: process.env.DB_NAME || "chatcms",
  port: Number(process.env.PORT) || 3000,
};

if (!config.mongoUri) {
  throw new Error("❌ Missing MONGO_URI in .env file");
}
