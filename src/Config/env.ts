import dotenv from "dotenv";

// Silenciar stdout temporariamente para evitar logs do dotenv quebram o MCP
const originalWrite = process.stdout.write;
// @ts-ignore
process.stdout.write = () => true;
dotenv.config();
process.stdout.write = originalWrite;

export const config = {
  mongoUri: process.env.MONGO_URI || "",
  dbName: process.env.DB_NAME || "chatcms",
  port: Number(process.env.PORT) || 3000,
};

if (!config.mongoUri) {
  throw new Error("❌ Missing MONGO_URI in .env file");
}
