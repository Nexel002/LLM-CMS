import { initMcpServer } from "./Mcp/index.ts";
import { logInfo } from "./Utils/logger.ts";

(async () => {
  try {
    await initMcpServer();
    logInfo("🚀 MCP Server rodando via stdio");
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
})();
