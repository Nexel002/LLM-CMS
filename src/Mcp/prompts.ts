import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Db } from "mongodb";
import { logInfo } from "../Utils/logger.js";

export function registerPrompts(server: Server, db: Db) {
  // Listar prompts disponíveis
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "create_blog_post",
          description: "Template para criar um post de blog estruturado",
          arguments: [
            {
              name: "topic",
              description: "Tópico do post",
              required: true,
            },
            {
              name: "tone",
              description: "Tom do post (formal, casual, técnico)",
              required: false,
            },
          ],
        },
        {
          name: "summarize_posts",
          description: "Resumir posts existentes no CMS",
          arguments: [
            {
              name: "count",
              description: "Número de posts a resumir",
              required: false,
            },
          ],
        },
        {
          name: "content_ideas",
          description: "Gerar ideias de conteúdo baseadas em posts existentes",
          arguments: [],
        },
      ],
    };
  });

  // Obter um prompt específico
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "create_blog_post": {
        const topic = args?.topic || "tecnologia";
        const tone = args?.tone || "profissional";

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Crie um post de blog sobre "${topic}" com tom ${tone}.

Estrutura esperada:
1. Título atraente
2. Introdução (1-2 parágrafos)
3. Corpo principal (3-5 seções)
4. Conclusão
5. Call-to-action

Use a ferramenta create_post para salvar o conteúdo no CMS.`,
              },
            },
          ],
        };
      }

      case "summarize_posts": {
        const count = args?.count || 5;

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Use a ferramenta list_posts para obter os últimos ${count} posts do CMS.
                
Em seguida, crie um resumo executivo que inclua:
- Temas principais abordados
- Insights-chave de cada post
- Tendências identificadas
- Sugestões de próximos tópicos`,
              },
            },
          ],
        };
      }

      case "content_ideas": {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Analise os posts existentes no CMS usando list_posts.

Com base no conteúdo existente, sugira:
1. 5 novos tópicos complementares
2. Gaps de conteúdo a preencher
3. Oportunidades de aprofundamento
4. Temas em alta que ainda não foram cobertos`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Prompt desconhecido: ${name}`);
    }
  });

  logInfo("💬 Prompts registrados");
}
