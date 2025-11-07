# 📚 Documentação Técnica - LLM-CMS (Parte 2)

## 🔧 Componentes MCP Detalhados

### 5. **Mcp/index.ts** - Orquestrador Principal

**Propósito**: Inicializar e configurar o servidor MCP.

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function initMcpServer() {
  // PASSO 1: Conectar ao MongoDB
  const db = await connectDB();
  logInfo("📦 Database conectada e pronta");

  // PASSO 2: Criar servidor MCP
  const server = new Server(
    {
      name: "llm-cms-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},      // Habilita ferramentas
        resources: {},  // Habilita recursos
        prompts: {},    // Habilita prompts
      },
    }
  );

  // PASSO 3: Registrar funcionalidades
  registerTools(server, db);
  registerResources(server, db);
  registerPrompts(server, db);

  // PASSO 4: Conectar ao transporte stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logInfo("✅ MCP Server inicializado com sucesso");
  return server;
}
```

**Explicação Linha por Linha**:

**Linha 11-19**: Criar Servidor MCP
```typescript
const server = new Server(
  // Metadados do servidor
  { name: "llm-cms-server", version: "1.0.0" },
  
  // Capabilities (o que o servidor pode fazer)
  {
    capabilities: {
      tools: {},      // Permite executar ações (CRUD)
      resources: {},  // Permite ler dados
      prompts: {},    // Permite usar templates
    }
  }
);
```

**Linha 30-32**: Registrar Handlers
```typescript
registerTools(server, db);     // Adiciona 5 ferramentas CRUD
registerResources(server, db); // Expõe posts como recursos
registerPrompts(server, db);   // Adiciona 3 templates
```

**Linha 35-36**: Conectar Transporte
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

**O Que É Stdio Transport?**
- **stdio** = Standard Input/Output
- Comunicação via `stdin` (entrada) e `stdout` (saída)
- LLM escreve comandos → stdin
- Servidor responde → stdout
- **Não usa HTTP/REST**

**Diagrama de Comunicação**:
```
┌─────────┐  stdin   ┌─────────────┐  MongoDB  ┌──────────┐
│   LLM   │ ──────→  │ MCP Server  │ ────────→ │ MongoDB  │
│ Claude  │          │   (stdio)   │           │  Atlas   │
└─────────┘  stdout  └─────────────┘           └──────────┘
            ←──────
```

---

### 6. **Mcp/tools.ts** - Ferramentas CRUD

**Propósito**: Implementar 5 ferramentas que LLMs podem usar.

#### **Estrutura Geral**

```typescript
export function registerTools(server: Server, db: Db) {
  const postsCollection = db.collection<Post>("posts");

  // PARTE 1: Listar ferramentas disponíveis
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [...] };
  });

  // PARTE 2: Executar ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "create_post": { /* ... */ }
      case "list_posts": { /* ... */ }
      // etc...
    }
  });
}
```

#### **PARTE 1: Listar Ferramentas (Linha 14-108)**

**O Que Faz**: Informa ao LLM quais ferramentas existem.

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_post",
        description: "Cria um novo post no CMS",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título do post" },
            content: { type: "string", description: "Conteúdo do post" },
            author: { type: "string", description: "Autor (opcional)" },
          },
          required: ["title", "content"], // Campos obrigatórios
        },
      },
      // ... outras 4 ferramentas
    ],
  };
});
```

**Por Que inputSchema?**
- Define **contrato** da ferramenta
- LLM sabe quais parâmetros enviar
- Validação automática de tipos
- Documentação integrada

**Exemplo de Uso pelo LLM**:
```
LLM vê: "create_post precisa de title (string) e content (string)"
LLM envia: { title: "Meu Post", content: "Conteúdo..." }
```

#### **PARTE 2: Executar Ferramentas (Linha 111-325)**

**Estrutura do Switch**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "create_post": { /* Criar */ }
      case "list_posts": { /* Listar */ }
      case "get_post": { /* Buscar */ }
      case "update_post": { /* Atualizar */ }
      case "delete_post": { /* Deletar */ }
      default: throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error) {
    // Tratamento de erros
  }
});
```

#### **Tool 1: create_post (Linha 116-146)**

```typescript
case "create_post": {
  // 1. Extrair parâmetros
  const { title, content, author } = args as {
    title: string;
    content: string;
    author?: string;
  };

  // 2. Criar objeto Post
  const newPost: Post = {
    title,
    content,
    author: author || "Anonymous", // Default se não fornecido
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 3. Inserir no MongoDB
  const result = await postsCollection.insertOne(newPost);
  logInfo(`✅ Post criado: ${result.insertedId}`);

  // 4. Retornar resposta MCP
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        id: result.insertedId.toString(),
        message: "Post criado com sucesso",
      }),
    }],
  };
}
```

**Fluxo Detalhado**:
1. **Type Assertion** (`as { title: string }`) - Garante tipos
2. **Default Value** (`author || "Anonymous"`) - Valor padrão
3. **Timestamps** - Adiciona datas automaticamente
4. **insertOne()** - Método MongoDB para inserir
5. **Resposta MCP** - Formato específico do protocolo

#### **Tool 2: list_posts (Linha 148-176)**

```typescript
case "list_posts": {
  const { limit = 10 } = args as { limit?: number };

  const posts = await postsCollection
    .find()                    // Busca todos
    .limit(limit)              // Limita quantidade
    .sort({ createdAt: -1 })   // Ordena por data (mais recente primeiro)
    .toArray();                // Converte cursor para array

  return {
    content: [{
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
    }],
  };
}
```

**Conceitos MongoDB**:
- `.find()` - Retorna cursor (não array)
- `.limit(10)` - Paginação
- `.sort({ createdAt: -1 })` - Ordenação (-1 = descendente)
- `.toArray()` - Materializa resultados

**Por Que map()?**
```typescript
posts.map((p) => ({
  id: p._id?.toString(), // Converte ObjectId para string
  title: p.title,
  // Retorna apenas campos necessários
}))
```
- Remove campos desnecessários
- Converte ObjectId para string (JSON-safe)
- Reduz tamanho da resposta

#### **Tool 3: get_post (Linha 178-219)**

```typescript
case "get_post": {
  const { id } = args as { id: string };

  // Buscar por ObjectId
  const post = await postsCollection.findOne({
    _id: new ObjectId(id), // Converte string para ObjectId
  });

  if (!post) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "Post não encontrado",
        }),
      }],
    };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        post: { /* dados completos */ },
      }),
    }],
  };
}
```

**Por Que `new ObjectId(id)`?**
```typescript
// LLM envia string
id = "673dac96852879e539368ad0"

// MongoDB precisa de ObjectId
_id: new ObjectId("673dac96852879e539368ad0")
```

**Validação de Existência**:
```typescript
if (!post) {
  // Retorna erro amigável
  return { success: false, error: "Post não encontrado" };
}
```

#### **Tool 4: update_post (Linha 221-269)**

```typescript
case "update_post": {
  const { id, title, content, author } = args as {
    id: string;
    title?: string;
    content?: string;
    author?: string;
  };

  // 1. Construir objeto de atualização
  const updateData: Partial<Post> = {
    updatedAt: new Date(), // Sempre atualiza timestamp
  };

  // 2. Adicionar apenas campos fornecidos
  if (title) updateData.title = title;
  if (content) updateData.content = content;
  if (author) updateData.author = author;

  // 3. Executar update
  const result = await postsCollection.updateOne(
    { _id: new ObjectId(id) },  // Filtro
    { $set: updateData }         // Operador MongoDB
  );

  // 4. Verificar se encontrou
  if (result.matchedCount === 0) {
    return { success: false, error: "Post não encontrado" };
  }

  return { success: true, message: "Post atualizado" };
}
```

**Partial Update Pattern**:
```typescript
const updateData: Partial<Post> = {};
if (title) updateData.title = title;
```
- Atualiza **apenas** campos fornecidos
- Não sobrescreve campos não mencionados
- Flexível e seguro

**Operador $set do MongoDB**:
```typescript
{ $set: { title: "Novo Título" } }
```
- Atualiza campos específicos
- Preserva outros campos
- Alternativa: `$unset` (remover), `$inc` (incrementar)

#### **Tool 5: delete_post (Linha 271-305)**

```typescript
case "delete_post": {
  const { id } = args as { id: string };

  const result = await postsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  if (result.deletedCount === 0) {
    return { success: false, error: "Post não encontrado" };
  }

  return { success: true, message: "Post deletado" };
}
```

**Verificação de Deleção**:
```typescript
result.deletedCount === 0  // Nenhum documento deletado
result.deletedCount === 1  // Deletou com sucesso
```

---

Continua na **DOCUMENTACAO-PARTE3.md**...
