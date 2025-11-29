import { initMcpServer } from "./Mcp/index.js";
import { logInfo } from "./Utils/logger.js";

(async () => {
  try {
    await initMcpServer();
    logInfo("🚀 MCP Server rodando via stdio");
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
})();
