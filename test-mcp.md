# Guia de Testes - LLM-CMS

## 🔍 Opção 1: MCP Inspector (Recomendado)

### Instalação
```bash
npx @modelcontextprotocol/inspector npm run dev
```

Isso abrirá uma interface web onde você pode:
- Ver todas as tools disponíveis
- Testar cada tool com parâmetros
- Ver os recursos expostos
- Testar prompts

---

## 🧪 Opção 2: Script de Teste Manual

Crie um arquivo `test.ts` para testar diretamente:

```typescript
import { connectDB } from "./src/DB/mongo.ts";
import { ObjectId } from "mongodb";

async function testTools() {
  const db = await connectDB();
  const postsCollection = db.collection("posts");

  console.log("🧪 Iniciando testes...\n");

  // Teste 1: Criar post
  console.log("1️⃣ Testando create_post...");
  const newPost = {
    title: "Meu Primeiro Post de Teste",
    content: "Este é um post criado para testar o sistema MCP.",
    author: "Antonio Mambo",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await postsCollection.insertOne(newPost);
  console.log("✅ Post criado:", result.insertedId.toString());

  // Teste 2: Listar posts
  console.log("\n2️⃣ Testando list_posts...");
  const posts = await postsCollection.find().limit(5).toArray();
  console.log(`✅ Encontrados ${posts.length} posts:`);
  posts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title} (${p.author})`);
  });

  // Teste 3: Buscar post específico
  console.log("\n3️⃣ Testando get_post...");
  const post = await postsCollection.findOne({ _id: result.insertedId });
  console.log("✅ Post encontrado:", post?.title);

  // Teste 4: Atualizar post
  console.log("\n4️⃣ Testando update_post...");
  await postsCollection.updateOne(
    { _id: result.insertedId },
    { $set: { title: "Post Atualizado!", updatedAt: new Date() } }
  );
  console.log("✅ Post atualizado");

  // Teste 5: Deletar post
  console.log("\n5️⃣ Testando delete_post...");
  await postsCollection.deleteOne({ _id: result.insertedId });
  console.log("✅ Post deletado");

  console.log("\n🎉 Todos os testes concluídos!");
  process.exit(0);
}

testTools().catch(console.error);
```

Execute com:
```bash
npx tsx test.ts
```

---

## 🌐 Opção 3: Testar com Claude Desktop

### 1. Configure o Claude Desktop
Edite o arquivo de configuração do Claude:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "llm-cms": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "cwd": "C:\\Users\\Antonio Mambo\\Documents\\NexelIT_Projetos\\LLM-MCS"
    }
  }
}
```

### 2. Reinicie o Claude Desktop

### 3. Teste no Chat
```
Você: "Liste todos os posts do CMS"
Claude: [Usa a tool list_posts]

Você: "Crie um post sobre TypeScript"
Claude: [Usa a tool create_post]
```

---

## 📊 Opção 4: Testar MongoDB Diretamente

### Via MongoDB Compass ou Atlas:
1. Conecte-se ao seu cluster
2. Navegue até o database `LLM-CMS`
3. Collection `posts`
4. Insira documentos manualmente
5. Verifique se aparecem via tools

---

## 🔧 Opção 5: Criar Testes Unitários

Crie `src/tests/tools.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectDB } from "../DB/mongo.ts";
import { Db } from "mongodb";

let db: Db;

beforeAll(async () => {
  db = await connectDB();
});

describe("Tools Tests", () => {
  it("should create a post", async () => {
    const collection = db.collection("posts");
    const result = await collection.insertOne({
      title: "Test Post",
      content: "Test Content",
      author: "Tester",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.insertedId).toBeDefined();
  });

  it("should list posts", async () => {
    const collection = db.collection("posts");
    const posts = await collection.find().toArray();
    expect(posts.length).toBeGreaterThan(0);
  });
});
```

Instale vitest:
```bash
npm install -D vitest
```

Execute:
```bash
npx vitest
```

---

## 🎯 Teste Rápido Recomendado

**Melhor forma de começar:**

1. **Teste direto no MongoDB** (verificar conexão)
2. **Script de teste manual** (testar CRUD)
3. **MCP Inspector** (testar protocolo MCP)
4. **Claude Desktop** (testar integração real)

---

## 📝 Checklist de Testes

- [ ] Conexão com MongoDB funciona
- [ ] create_post cria documentos
- [ ] list_posts retorna lista
- [ ] get_post encontra por ID
- [ ] update_post atualiza campos
- [ ] delete_post remove documentos
- [ ] Resources expõem posts
- [ ] Prompts retornam templates
- [ ] Servidor MCP inicia sem erros
- [ ] Integração com Claude funciona
