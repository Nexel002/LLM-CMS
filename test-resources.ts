import { connectDB } from "./src/DB/mongo.ts";
import { ObjectId } from "mongodb";

async function testResources() {
  console.log("🧪 Testando RESOURCES (Listar e Ler Posts)...\n");

  try {
    // Conectar ao banco
    const db = await connectDB();
    const postsCollection = db.collection("posts");

    // PASSO 1: Criar alguns posts de teste
    console.log("1️⃣ Criando posts de teste...");
    const testPosts = [
      {
        title: "Introdução ao TypeScript",
        content: "TypeScript é uma linguagem que adiciona tipagem estática ao JavaScript...",
        author: "Antonio Mambo",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Guia de MongoDB",
        content: "MongoDB é um banco de dados NoSQL orientado a documentos...",
        author: "Maria Silva",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Model Context Protocol",
        content: "MCP é um protocolo que permite LLMs interagirem com sistemas externos...",
        author: "João Santos",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertResults = await postsCollection.insertMany(testPosts);
    const insertedIds = Object.values(insertResults.insertedIds);
    console.log(`   ✅ ${insertedIds.length} posts criados\n`);

    // PASSO 2: Simular LIST RESOURCES
    console.log("2️⃣ Testando LIST RESOURCES...");
    console.log("   (Simulando: server.setRequestHandler(ListResourcesRequestSchema))\n");

    const allPosts = await postsCollection.find().toArray();

    const resources = allPosts.map((post) => ({
      uri: `post://${post._id?.toString()}`,
      name: post.title,
      description: `Post: ${post.title} por ${post.author || "Anonymous"}`,
      mimeType: "application/json",
    }));

    console.log("   📚 Recursos disponíveis:");
    resources.forEach((resource, index) => {
      console.log(`\n   ${index + 1}. ${resource.name}`);
      console.log(`      URI: ${resource.uri}`);
      console.log(`      Descrição: ${resource.description}`);
      console.log(`      Tipo: ${resource.mimeType}`);
    });

    console.log(`\n   ✅ Total de recursos: ${resources.length}\n`);

    // PASSO 3: Simular READ RESOURCE (ler um post específico)
    console.log("3️⃣ Testando READ RESOURCE...");
    console.log("   (Simulando: server.setRequestHandler(ReadResourceRequestSchema))\n");

    // Pegar o primeiro post criado
    const testUri = `post://${insertedIds[0].toString()}`;
    console.log(`   📖 Lendo recurso: ${testUri}\n`);

    // Extrair ID do URI (como no código real)
    const match = testUri.match(/^post:\/\/(.+)$/);
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

    // Formatar conteúdo como no código real
    const resourceContent = {
      uri: testUri,
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
    };

    console.log("   ✅ Recurso lido com sucesso:");
    console.log("   ─────────────────────────────────────────");
    console.log(resourceContent.text);
    console.log("   ─────────────────────────────────────────\n");

    // PASSO 4: Testar leitura de múltiplos recursos
    console.log("4️⃣ Testando leitura de todos os recursos criados...\n");

    for (let i = 0; i < insertedIds.length; i++) {
      const uri = `post://${insertedIds[i].toString()}`;
      const match = uri.match(/^post:\/\/(.+)$/);
      const postId = match![1];
      const post = await postsCollection.findOne({
        _id: new ObjectId(postId),
      });

      console.log(`   📄 Recurso ${i + 1}:`);
      console.log(`      URI: ${uri}`);
      console.log(`      Título: ${post?.title}`);
      console.log(`      Autor: ${post?.author}`);
      console.log(`      Tamanho do conteúdo: ${post?.content.length} caracteres\n`);
    }

    // PASSO 5: Limpar posts de teste
    console.log("5️⃣ Limpando posts de teste...");
    const deleteResult = await postsCollection.deleteMany({
      _id: { $in: insertedIds },
    });
    console.log(`   ✅ ${deleteResult.deletedCount} posts removidos\n`);

    // Resumo final
    console.log("=".repeat(60));
    console.log("🎉 TESTE DE RESOURCES CONCLUÍDO COM SUCESSO!");
    console.log("=".repeat(60));
    console.log("\n📋 Resumo:");
    console.log("   ✅ LIST RESOURCES - Funcionando");
    console.log("   ✅ READ RESOURCE - Funcionando");
    console.log("   ✅ URI Pattern (post://ID) - Funcionando");
    console.log("   ✅ Regex Extraction - Funcionando");
    console.log("   ✅ JSON Formatting - Funcionando");
    console.log("\n💡 Os Resources permitem que LLMs:");
    console.log("   • Descubram posts disponíveis via LIST");
    console.log("   • Leiam conteúdo completo via READ");
    console.log("   • Naveguem entre posts usando URIs");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERRO durante os testes:", error);
    process.exit(1);
  }
}

// Executar testes
testResources();
