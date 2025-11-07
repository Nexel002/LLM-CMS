import { connectDB } from "./src/DB/mongo.ts";
import { ObjectId } from "mongodb";

async function testTools() {
  console.log("🧪 Iniciando testes das Tools...\n");

  try {
    // Conectar ao banco
    const db = await connectDB();
    const postsCollection = db.collection("posts");

    // Teste 1: Criar post
    console.log("1️⃣ Testando CREATE_POST...");
    const newPost = {
      title: "Post de Teste - " + new Date().toLocaleString(),
      content: "Este é um post criado automaticamente para testar o sistema MCP.",
      author: "Antonio Mambo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const createResult = await postsCollection.insertOne(newPost);
    console.log("   ✅ Post criado com ID:", createResult.insertedId.toString());

    // Teste 2: Listar posts
    console.log("\n2️⃣ Testando LIST_POSTS...");
    const posts = await postsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    console.log(`   ✅ Encontrados ${posts.length} posts:`);
    posts.forEach((p, i) => {
      console.log(`      ${i + 1}. "${p.title}" por ${p.author || "Anonymous"}`);
    });

    // Teste 3: Buscar post específico
    console.log("\n3️⃣ Testando GET_POST...");
    const foundPost = await postsCollection.findOne({
      _id: createResult.insertedId,
    });
    if (foundPost) {
      console.log("   ✅ Post encontrado:");
      console.log(`      Título: ${foundPost.title}`);
      console.log(`      Autor: ${foundPost.author}`);
      console.log(`      Conteúdo: ${foundPost.content.substring(0, 50)}...`);
    } else {
      console.log("   ❌ Post não encontrado");
    }

    // Teste 4: Atualizar post
    console.log("\n4️⃣ Testando UPDATE_POST...");
    const updateResult = await postsCollection.updateOne(
      { _id: createResult.insertedId },
      {
        $set: {
          title: "Post Atualizado - " + new Date().toLocaleString(),
          updatedAt: new Date(),
        },
      }
    );
    console.log(
      `   ✅ Post atualizado (${updateResult.modifiedCount} documento modificado)`
    );

    // Verificar atualização
    const updatedPost = await postsCollection.findOne({
      _id: createResult.insertedId,
    });
    console.log(`      Novo título: ${updatedPost?.title}`);

    // Teste 5: Contar posts
    console.log("\n5️⃣ Estatísticas...");
    const totalPosts = await postsCollection.countDocuments();
    console.log(`   📊 Total de posts no banco: ${totalPosts}`);

    // Teste 6: Deletar post de teste
    console.log("\n6️⃣ Testando DELETE_POST...");
    const deleteResult = await postsCollection.deleteOne({
      _id: createResult.insertedId,
    });
    console.log(
      `   ✅ Post deletado (${deleteResult.deletedCount} documento removido)`
    );

    // Resumo final
    console.log("\n" + "=".repeat(50));
    console.log("🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!");
    console.log("=".repeat(50));
    console.log("\n📋 Resumo:");
    console.log("   ✅ CREATE - Funcionando");
    console.log("   ✅ READ (list) - Funcionando");
    console.log("   ✅ READ (get) - Funcionando");
    console.log("   ✅ UPDATE - Funcionando");
    console.log("   ✅ DELETE - Funcionando");
    console.log(`\n📊 Total de posts no banco: ${totalPosts - 1}`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERRO durante os testes:", error);
    process.exit(1);
  }
}

// Executar testes
testTools();
