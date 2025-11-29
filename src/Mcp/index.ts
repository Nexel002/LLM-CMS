import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { connectDB } from "../DB/mongo.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { logInfo } from "../Utils/logger.js";

export async function initMcpServer() {
  // Conectar ao MongoDB
  const db = await connectDB();
  logInfo("📦 Database conectada e pronta");

  // Criar servidor MCP
  const server = new Server(
    {
      name: "llm-cms-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Registrar tools, resources e prompts
  registerTools(server, db);
  registerResources(server, db);
  registerPrompts(server, db);

  // Conectar ao transporte stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logInfo("✅ MCP Server inicializado com sucesso");

  return server;
}
