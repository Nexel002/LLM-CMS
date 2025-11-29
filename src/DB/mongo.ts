import { MongoClient } from "mongodb";
import { config } from "../Config/env.js";
import { logInfo, logError } from "../Utils/logger.js";

let client: MongoClient;

export async function connectDB() {
  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    logInfo("✅ Conectado ao MongoDB Atlas");
    return client.db(config.dbName);
  } catch (err) {
    logError("❌ Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  }
}

export function getClient(): MongoClient {
  if (!client) throw new Error("MongoClient não inicializado");
  return client;
}
