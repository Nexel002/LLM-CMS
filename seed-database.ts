import { connectDB } from "./src/DB/mongo.ts";

async function seedDatabase() {
  console.log("🌱 Populando banco de dados com posts de exemplo...\n");

  try {
    const db = await connectDB();
    const postsCollection = db.collection("posts");

    // Verificar se já existem posts
    const existingCount = await postsCollection.countDocuments();
    console.log(`📊 Posts existentes no banco: ${existingCount}\n`);

    // Posts de exemplo
    const samplePosts = [
      {
        title: "Introdução ao TypeScript",
        content: `TypeScript é uma linguagem de programação desenvolvida pela Microsoft que adiciona tipagem estática ao JavaScript.

## Principais Benefícios:
- Detecção de erros em tempo de desenvolvimento
- Melhor autocomplete e IntelliSense
- Refatoração mais segura
- Documentação viva através dos tipos

## Exemplo de Código:
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Olá, \${user.name}!\`;
}
\`\`\`

TypeScript é amplamente usado em projetos modernos e é a base de frameworks como Angular.`,
        author: "Antonio Mambo",
        createdAt: new Date("2025-11-01T10:00:00Z"),
        updatedAt: new Date("2025-11-01T10:00:00Z"),
      },
      {
        title: "Guia Completo de MongoDB",
        content: `MongoDB é um banco de dados NoSQL orientado a documentos que armazena dados em formato JSON-like (BSON).

## Características Principais:
- Schema flexível
- Alta performance
- Escalabilidade horizontal
- Consultas poderosas

## Operações CRUD:
- **Create**: insertOne(), insertMany()
- **Read**: find(), findOne()
- **Update**: updateOne(), updateMany()
- **Delete**: deleteOne(), deleteMany()

## Exemplo:
\`\`\`javascript
db.posts.insertOne({
  title: "Meu Post",
  content: "Conteúdo...",
  createdAt: new Date()
});
\`\`\`

MongoDB é ideal para aplicações que precisam de flexibilidade e escalabilidade.`,
        author: "Maria Silva",
        createdAt: new Date("2025-11-02T14:30:00Z"),
        updatedAt: new Date("2025-11-02T14:30:00Z"),
      },
      {
        title: "Model Context Protocol (MCP) Explicado",
        content: `O Model Context Protocol (MCP) é um protocolo aberto que permite que Large Language Models (LLMs) interajam com sistemas externos de forma padronizada.

## Componentes do MCP:
1. **Tools** - Ações que o LLM pode executar
2. **Resources** - Dados que o LLM pode ler
3. **Prompts** - Templates para guiar o LLM

## Vantagens:
- Padronização da comunicação LLM ↔ Sistema
- Segurança através de permissões
- Extensibilidade
- Suporte a múltiplos transportes (stdio, HTTP)

## Casos de Uso:
- Acesso a bancos de dados
- Integração com APIs
- Automação de tarefas
- Gerenciamento de conteúdo

MCP está revolucionando como LLMs interagem com o mundo real.`,
        author: "João Santos",
        createdAt: new Date("2025-11-03T09:15:00Z"),
        updatedAt: new Date("2025-11-03T09:15:00Z"),
      },
      {
        title: "Async/Await em JavaScript",
        content: `Async/await é uma sintaxe moderna para trabalhar com código assíncrono em JavaScript, tornando-o mais legível e fácil de manter.

## Antes (Callbacks):
\`\`\`javascript
getData(function(data) {
  processData(data, function(result) {
    saveResult(result, function() {
      console.log("Done!");
    });
  });
});
\`\`\`

## Depois (Async/Await):
\`\`\`javascript
async function workflow() {
  const data = await getData();
  const result = await processData(data);
  await saveResult(result);
  console.log("Done!");
}
\`\`\`

## Tratamento de Erros:
\`\`\`javascript
try {
  const data = await fetchData();
} catch (error) {
  console.error("Erro:", error);
}
\`\`\`

Async/await é essencial para desenvolvimento JavaScript moderno.`,
        author: "Pedro Costa",
        createdAt: new Date("2025-11-04T16:45:00Z"),
        updatedAt: new Date("2025-11-04T16:45:00Z"),
      },
      {
        title: "REST API Best Practices",
        content: `REST (Representational State Transfer) é um estilo arquitetural para construir APIs web escaláveis e manuteníveis.

## Princípios REST:
1. **Stateless** - Cada requisição é independente
2. **Client-Server** - Separação de responsabilidades
3. **Cacheable** - Respostas podem ser cacheadas
4. **Uniform Interface** - Interface consistente

## Verbos HTTP:
- GET - Buscar recursos
- POST - Criar recursos
- PUT/PATCH - Atualizar recursos
- DELETE - Remover recursos

## Exemplo de Endpoints:
\`\`\`
GET    /api/posts       → Listar posts
GET    /api/posts/:id   → Buscar post
POST   /api/posts       → Criar post
PUT    /api/posts/:id   → Atualizar post
DELETE /api/posts/:id   → Deletar post
\`\`\`

## Status Codes:
- 200 OK
- 201 Created
- 400 Bad Request
- 404 Not Found
- 500 Internal Server Error

APIs REST bem projetadas são a base de aplicações modernas.`,
        author: "Ana Oliveira",
        createdAt: new Date("2025-11-05T11:20:00Z"),
        updatedAt: new Date("2025-11-05T11:20:00Z"),
      },
    ];

    console.log(`📝 Inserindo ${samplePosts.length} posts de exemplo...\n`);

    const result = await postsCollection.insertMany(samplePosts);
    const insertedIds = Object.values(result.insertedIds);

    console.log("✅ Posts inseridos com sucesso!\n");
    console.log("📋 Posts criados:");
    console.log("─".repeat(60));

    for (let i = 0; i < samplePosts.length; i++) {
      console.log(`\n${i + 1}. ${samplePosts[i].title}`);
      console.log(`   ID: ${insertedIds[i].toString()}`);
      console.log(`   Autor: ${samplePosts[i].author}`);
      console.log(`   Data: ${samplePosts[i].createdAt.toLocaleDateString()}`);
    }

    console.log("\n" + "─".repeat(60));

    const totalPosts = await postsCollection.countDocuments();
    console.log(`\n📊 Total de posts no banco agora: ${totalPosts}`);

    console.log("\n🎉 Banco de dados populado com sucesso!");
    console.log("\n💡 Agora você pode:");
    console.log("   • Ver os posts no MongoDB Atlas");
    console.log("   • Testar as tools do MCP");
    console.log("   • Usar com Claude Desktop");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao popular banco:", error);
    process.exit(1);
  }
}

seedDatabase();
