import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Db, ObjectId } from "mongodb";
import { Post } from "../Models/post.js";
import { logInfo, logError } from "../Utils/logger.js";

export function registerResources(server: Server, db: Db) {
  const postsCollection = db.collection<Post>("posts");

  // Listar recursos disponíveis
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const posts = await postsCollection.find().toArray();

      return {
        resources: posts.map((post) => ({
          uri: `post://${post._id?.toString()}`,
          name: post.title,
          description: `Post: ${post.title} por ${post.author || "Anonymous"}`,
          mimeType: "application/json",
        })),
      };
    } catch (error) {
      logError("❌ Erro ao listar recursos:", error);
      return { resources: [] };
    }
  });

  // Ler um recurso específico
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
      // Extrair ID do URI (formato: post://ID)
      const match = uri.match(/^post:\/\/(.+)$/);
      if (!match) {
        throw new Error("URI inválido");
      }

      const postId = match[1];
      const post = await postsCollection.findOne({
        _id: new ObjectId(postId),
      });

      if (!post) {
        throw new Error("Post não encontrado");
      }

      logInfo(`📖 Recurso lido: ${post.title}`);

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                id: post._id?.toString(),
                title: post.title,
                content: post.content,
                author: post.author,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logError(`❌ Erro ao ler recurso ${uri}:`, error);
      throw error;
    }
  });

  logInfo("📚 Resources registrados");
}
