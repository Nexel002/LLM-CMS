# 📚 Documentação Técnica - LLM-CMS (Parte 3)

## 📚 Resources e Prompts

### 7. **Mcp/resources.ts** - Exposição de Dados

**Propósito**: Expor posts como recursos que LLMs podem ler.

#### **Diferença: Tools vs Resources**

```
TOOLS (Ações)              RESOURCES (Dados)
─────────────              ─────────────────
create_post()              post://673dac...
list_posts()               post://673dab...
update_post()              post://673daa...
delete_post()              (Leitura apenas)

Verbos: CREATE, UPDATE     Verbos: READ
Muda estado do sistema     Apenas consulta
```

#### **Estrutura do Resources**

```typescript
export function registerResources(server: Server, db: Db) {
  const postsCollection = db.collection<Post>("posts");

  // PARTE 1: Listar recursos disponíveis
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const posts = await postsCollection.find().toArray();

    return {
      resources: posts.map((post) => ({
        uri: `post://${post._id?.toString()}`,
        name: post.title,
        description: `Post: ${post.title} por ${post.author}`,
        mimeType: "application/json",
      })),
    };
  });

  // PARTE 2: Ler recurso específico
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    // Processar URI e retornar dados
  });
}
```

#### **PARTE 1: Listar Resources (Linha 14-30)**

**O Que Retorna**:
```json
{
  "resources": [
    {
      "uri": "post://673dac96852879e539368ad0",
      "name": "Introdução ao TypeScript",
      "description": "Post: Introdução ao TypeScript por Antonio",
      "mimeType": "application/json"
    },
    {
      "uri": "post://673dab12345678901234567",
      "name": "Guia de MongoDB",
      "description": "Post: Guia de MongoDB por Maria",
      "mimeType": "application/json"
    }
  ]
}
```

**Conceito de URI**:
```
post://673dac96852879e539368ad0
│      │
│      └─ ID do post (ObjectId como string)
└─ Esquema customizado
```

**Por Que URIs?**
- Identificador único e global
- Padrão web (como http://)
- Permite navegação entre recursos
- LLM pode "linkar" recursos

#### **PARTE 2: Ler Resource (Linha 33-78)**

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // 1. Extrair ID do URI usando regex
  const match = uri.match(/^post:\/\/(.+)$/);
  if (!match) {
    throw new Error("URI inválido");
  }

  const postId = match[1]; // Captura grupo 1 da regex

  // 2. Buscar post no MongoDB
  const post = await postsCollection.findOne({
    _id: new ObjectId(postId),
  });

  if (!post) {
    throw new Error("Post não encontrado");
  }

  // 3. Retornar conteúdo formatado
  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify({
        id: post._id?.toString(),
        title: post.title,
        content: post.content,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }, null, 2), // Indentação de 2 espaços
    }],
  };
});
```

**Regex Explicada**:
```javascript
/^post:\/\/(.+)$/
│ │    │   │  │
│ │    │   │  └─ Fim da string
│ │    │   └─ Captura tudo (.+)
│ │    └─ Escapa // literal
│ └─ Início da string
└─ Começa com "post:"

Exemplo:
Input:  "post://673dac96852879e539368ad0"
match[0]: "post://673dac96852879e539368ad0" (match completo)
match[1]: "673dac96852879e539368ad0"        (grupo capturado)
```

**JSON.stringify com Formatação**:
```typescript
JSON.stringify(obj, null, 2)
//             │    │    └─ Indentação (2 espaços)
//             │    └─ Replacer (null = todos campos)
//             └─ Objeto a serializar

// Resultado:
{
  "id": "673dac...",
  "title": "Meu Post",
  "content": "..."
}
```

---

### 8. **Mcp/prompts.ts** - Templates para LLMs

**Propósito**: Fornecer templates pré-configurados que guiam o LLM.

#### **O Que São Prompts no MCP?**

Prompts são **instruções reutilizáveis** que:
- Guiam o LLM em tarefas específicas
- Podem ter parâmetros dinâmicos
- Combinam texto + ferramentas
- Aceleram workflows comuns

#### **Estrutura Geral**

```typescript
export function registerPrompts(server: Server, db: Db) {
  // PARTE 1: Listar prompts disponíveis
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "create_blog_post",
          description: "Template para criar post estruturado",
          arguments: [
            { name: "topic", description: "Tópico", required: true },
            { name: "tone", description: "Tom", required: false },
          ],
        },
        // ... outros prompts
      ],
    };
  });

  // PARTE 2: Obter prompt específico
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    switch (name) {
      case "create_blog_post": { /* ... */ }
      case "summarize_posts": { /* ... */ }
      case "content_ideas": { /* ... */ }
    }
  });
}
```

#### **Prompt 1: create_blog_post (Linha 55-79)**

```typescript
case "create_blog_post": {
  const topic = args?.topic || "tecnologia";
  const tone = args?.tone || "profissional";

  return {
    messages: [{
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
    }],
  };
}
```

**Como Funciona**:
1. LLM invoca prompt: `create_blog_post(topic="IA", tone="casual")`
2. Servidor retorna mensagem formatada
3. LLM processa instrução
4. LLM usa tool `create_post` automaticamente
5. Post é salvo no MongoDB

**Exemplo de Uso**:
```
Usuário: "Use o prompt create_blog_post sobre Machine Learning"

LLM recebe:
"Crie um post de blog sobre 'Machine Learning' com tom profissional.
Estrutura esperada: ..."

LLM gera:
{
  title: "Introdução ao Machine Learning",
  content: "Machine Learning é...",
  author: "AI Assistant"
}

LLM executa:
create_post(title="...", content="...", author="...")

Resultado:
Post salvo no MongoDB ✅
```

#### **Prompt 2: summarize_posts (Linha 81-101)**

```typescript
case "summarize_posts": {
  const count = args?.count || 5;

  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Use a ferramenta list_posts para obter os últimos ${count} posts.
        
Em seguida, crie um resumo executivo que inclua:
- Temas principais abordados
- Insights-chave de cada post
- Tendências identificadas
- Sugestões de próximos tópicos`,
      },
    }],
  };
}
```

**Workflow Multi-Step**:
```
1. LLM executa: list_posts(limit=5)
2. LLM recebe: [post1, post2, post3, post4, post5]
3. LLM analisa conteúdo
4. LLM gera resumo executivo
5. LLM retorna ao usuário
```

#### **Prompt 3: content_ideas (Linha 103-121)**

```typescript
case "content_ideas": {
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Analise os posts existentes usando list_posts.

Com base no conteúdo existente, sugira:
1. 5 novos tópicos complementares
2. Gaps de conteúdo a preencher
3. Oportunidades de aprofundamento
4. Temas em alta que ainda não foram cobertos`,
      },
    }],
  };
}
```

**Caso de Uso**:
- Editor de conteúdo precisa de ideias
- LLM analisa posts existentes
- Identifica padrões e gaps
- Sugere próximos tópicos

---

## 🔄 Fluxo Completo de Execução

### Cenário: Usuário Pede para Criar Post

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO                                                  │
│    "Crie um post sobre TypeScript"                         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. LLM (Claude)                                             │
│    - Entende intenção                                       │
│    - Decide usar tool "create_post"                         │
│    - Gera parâmetros: { title: "...", content: "..." }     │
└────────────────────────┬────────────────────────────────────┘
                         ↓ MCP Protocol (JSON-RPC via stdio)
┌─────────────────────────────────────────────────────────────┐
│ 3. MCP SERVER (server.ts)                                   │
│    - Recebe via stdin                                       │
│    - Parseia JSON                                           │
│    - Roteia para handler correto                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TOOLS HANDLER (tools.ts)                                 │
│    - Identifica tool: "create_post"                         │
│    - Extrai args: { title, content, author }                │
│    - Cria objeto Post com timestamps                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. MONGODB                                                  │
│    - Executa: postsCollection.insertOne(newPost)            │
│    - Gera ObjectId automático                               │
│    - Retorna: { insertedId: ObjectId("...") }               │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. RESPOSTA MCP                                             │
│    - Formata JSON: { success: true, id: "..." }             │
│    - Envia via stdout                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. LLM (Claude)                                             │
│    - Recebe confirmação                                     │
│    - Gera resposta amigável                                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. USUÁRIO                                                  │
│    "✅ Post criado com sucesso! ID: 673dac..."              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Conceitos-Chave do MCP

### 1. **JSON-RPC 2.0**

MCP usa JSON-RPC para comunicação:

```json
// Requisição
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "title": "Meu Post",
      "content": "Conteúdo..."
    }
  }
}

// Resposta
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\":true,\"id\":\"...\"}"
    }]
  }
}
```

### 2. **Request Schemas**

Schemas definem tipos de requisições:

```typescript
ListToolsRequestSchema    // Listar ferramentas
CallToolRequestSchema     // Executar ferramenta
ListResourcesRequestSchema // Listar recursos
ReadResourceRequestSchema  // Ler recurso
ListPromptsRequestSchema   // Listar prompts
GetPromptRequestSchema     // Obter prompt
```

### 3. **Stdio Transport**

```
┌──────────┐  stdin   ┌──────────┐
│   LLM    │ ──────→  │  Server  │
│          │          │          │
│          │  stdout  │          │
│          │ ←──────  │          │
└──────────┘          └──────────┘

Vantagens:
✅ Simples (sem HTTP)
✅ Baixa latência
✅ Seguro (local)
✅ Fácil debug
```

---

Continua na **DOCUMENTACAO-PARTE4.md**...
