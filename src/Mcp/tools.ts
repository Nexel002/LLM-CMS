import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Db, ObjectId } from "mongodb";
import { Post } from "../Models/post.js";
import { logInfo, logError } from "../Utils/logger.js";

export function registerTools(server: Server, db: Db) {
  const postsCollection = db.collection<Post>("posts");

  // Listar ferramentas disponíveis
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "create_post",
          description: "Cria um novo post no CMS",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Título do post",
              },
              content: {
                type: "string",
                description: "Conteúdo do post",
              },
              author: {
                type: "string",
                description: "Autor do post (opcional)",
              },
            },
            required: ["title", "content"],
          },
        },
        {
          name: "list_posts",
          description: "Lista todos os posts do CMS",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Número máximo de posts a retornar (padrão: 10)",
              },
            },
          },
        },
        {
          name: "get_post",
          description: "Obtém um post específico pelo ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "ID do post",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "update_post",
          description: "Atualiza um post existente",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "ID do post a atualizar",
              },
              title: {
                type: "string",
                description: "Novo título (opcional)",
              },
              content: {
                type: "string",
                description: "Novo conteúdo (opcional)",
              },
              author: {
                type: "string",
                description: "Novo autor (opcional)",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "delete_post",
          description: "Deleta um post pelo ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "ID do post a deletar",
              },
            },
            required: ["id"],
          },
        },
      ],
    };
  });

  // Executar ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_post": {
          const { title, content, author } = args as {
            title: string;
            content: string;
            author?: string;
          };

          const newPost: Post = {
            title,
            content,
            author: author || "Anonymous",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await postsCollection.insertOne(newPost);
          logInfo(`✅ Post criado: ${result.insertedId}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  id: result.insertedId.toString(),
                  message: "Post criado com sucesso",
                }),
              },
            ],
          };
        }

        case "list_posts": {
          const { limit = 10 } = args as { limit?: number };

          const posts = await postsCollection
            .find()
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

          logInfo(`📋 Listando ${posts.length} posts`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  count: posts.length,
                  posts: posts.map((p) => ({
                    id: p._id?.toString(),
                    title: p.title,
                    author: p.author,
                    createdAt: p.createdAt,
                  })),
                }),
              },
            ],
          };
        }

        case "get_post": {
          const { id } = args as { id: string };

          const post = await postsCollection.findOne({
            _id: new ObjectId(id),
          });

          if (!post) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: "Post não encontrado",
                  }),
                },
              ],
            };
          }

          logInfo(`📄 Post encontrado: ${id}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  post: {
                    id: post._id?.toString(),
                    title: post.title,
                    content: post.content,
                    author: post.author,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                  },
                }),
              },
            ],
          };
        }

        case "update_post": {
          const { id, title, content, author } = args as {
            id: string;
            title?: string;
            content?: string;
            author?: string;
          };

          const updateData: Partial<Post> = {
            updatedAt: new Date(),
          };

          if (title) updateData.title = title;
          if (content) updateData.content = content;
          if (author) updateData.author = author;

          const result = await postsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: "Post não encontrado",
                  }),
                },
              ],
            };
          }

          logInfo(`✏️ Post atualizado: ${id}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Post atualizado com sucesso",
                }),
              },
            ],
          };
        }

        case "delete_post": {
          const { id } = args as { id: string };

          const result = await postsCollection.deleteOne({
            _id: new ObjectId(id),
          });

          if (result.deletedCount === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: "Post não encontrado",
                  }),
                },
              ],
            };
          }

          logInfo(`🗑️ Post deletado: ${id}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Post deletado com sucesso",
                }),
              },
            ],
          };
        }

        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    } catch (error) {
      logError(`❌ Erro ao executar ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            }),
          },
        ],
        isError: true,
      };
    }
  });

  logInfo("🔧 Tools registradas");
}
