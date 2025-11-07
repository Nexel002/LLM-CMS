# 📚 Documentação Técnica - LLM-CMS

## 📖 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Componentes Detalhados](#componentes-detalhados)
5. [Model Context Protocol (MCP)](#model-context-protocol-mcp)

---

## 🎯 Visão Geral

### O Que É Este Projeto?

O **LLM-CMS** é um **Content Management System** (Sistema de Gerenciamento de Conteúdo) que permite que **Large Language Models (LLMs)** gerenciem conteúdo de forma autônoma através do **Model Context Protocol (MCP)**.

### Problema Que Resolve

Normalmente, LLMs como ChatGPT ou Claude não conseguem:
- Salvar dados permanentemente
- Acessar bancos de dados
- Executar operações CRUD (Create, Read, Update, Delete)

Este projeto resolve isso criando uma **ponte** entre LLMs e MongoDB usando o protocolo MCP.

### Tecnologias Utilizadas

```
TypeScript     → Linguagem principal
MongoDB Atlas  → Banco de dados NoSQL
MCP SDK        → Protocolo de comunicação com LLMs
Node.js        → Runtime JavaScript
tsx            → Executor TypeScript
```

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    LLM (Claude/GPT)                     │
│              "Crie um post sobre IA"                    │
└────────────────────┬────────────────────────────────────┘
                     │ MCP Protocol (stdio)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              MCP Server (src/server.ts)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │         initMcpServer() - Orquestrador            │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
   ┌────────┐  ┌──────────┐  ┌─────────┐
   │ Tools  │  │Resources │  │ Prompts │
   │(CRUD)  │  │(Dados)   │  │(Templates)│
   └───┬────┘  └────┬─────┘  └─────────┘
       │            │
       └────────┬───┘
                ↓
   ┌─────────────────────────┐
   │   MongoDB Atlas         │
   │   Collection: posts     │
   │   { _id, title, ... }   │
   └─────────────────────────┘
```

### Fluxo de Comunicação

```
1. LLM envia comando MCP → "list_posts"
2. MCP Server recebe via stdio
3. Roteia para registerTools()
4. Executa query no MongoDB
5. Retorna JSON para LLM
6. LLM processa e responde ao usuário
```

---

## 🔄 Fluxo de Dados Detalhado

### Exemplo: Criar um Post

```typescript
// 1. LLM envia requisição MCP
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "title": "Introdução ao TypeScript",
      "content": "TypeScript é...",
      "author": "Antonio"
    }
  }
}

// 2. MCP Server recebe (tools.ts linha 111)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // 3. Switch para a tool correta (linha 115)
  switch (name) {
    case "create_post": {
      // 4. Extrai parâmetros (linha 117)
      const { title, content, author } = args;
      
      // 5. Cria objeto Post (linha 123)
      const newPost: Post = {
        title,
        content,
        author: author || "Anonymous",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 6. Insere no MongoDB (linha 131)
      const result = await postsCollection.insertOne(newPost);
      
      // 7. Retorna sucesso (linha 134)
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            id: result.insertedId.toString(),
            message: "Post criado com sucesso"
          })
        }]
      };
    }
  }
});

// 8. LLM recebe resposta
{
  "success": true,
  "id": "673dac96852879e539368ad0",
  "message": "Post criado com sucesso"
}
```

---

## 📦 Componentes Detalhados

### 1. **Config/env.ts** - Gerenciamento de Configurações

**Propósito**: Carregar e validar variáveis de ambiente.

```typescript
import dotenv from "dotenv";
dotenv.config(); // Carrega .env

export const config = {
  mongoUri: process.env.MONGO_URI || "",
  dbName: process.env.DB_NAME || "chatcms",
  port: Number(process.env.PORT) || 3000,
};

// Validação crítica
if (!config.mongoUri) {
  throw new Error("❌ Missing MONGO_URI in .env file");
}
```

**Como Funciona**:
1. `dotenv.config()` lê arquivo `.env`
2. `process.env.MONGO_URI` acessa variável
3. Operador `||` define valor padrão
4. Validação garante que MONGO_URI existe
5. Se faltar, aplicação **não inicia**

**Por Que É Importante**:
- Separa configuração de código
- Permite diferentes ambientes (dev/prod)
- Protege credenciais (não commitar .env)

---

### 2. **DB/mongo.ts** - Conexão com MongoDB

**Propósito**: Gerenciar conexão única com MongoDB Atlas.

```typescript
import { MongoClient } from "mongodb";
import { config } from "../Config/env.ts";

let client: MongoClient; // Singleton pattern

export async function connectDB() {
  try {
    // 1. Cria cliente MongoDB
    client = new MongoClient(config.mongoUri);
    
    // 2. Conecta ao cluster
    await client.connect();
    
    // 3. Log de sucesso
    logInfo("✅ Conectado ao MongoDB Atlas");
    
    // 4. Retorna database específico
    return client.db(config.dbName);
  } catch (err) {
    logError("❌ Erro ao conectar ao MongoDB:", err);
    process.exit(1); // Encerra se falhar
  }
}

export function getClient(): MongoClient {
  if (!client) throw new Error("MongoClient não inicializado");
  return client;
}
```

**Padrão Singleton**:
- Variável `client` é compartilhada
- Uma única conexão para toda aplicação
- Economiza recursos e conexões

**Fluxo de Conexão**:
```
1. new MongoClient(uri) → Cria cliente
2. client.connect()     → Estabelece conexão TCP
3. client.db(name)      → Seleciona database
4. db.collection()      → Acessa collection
```

---

### 3. **Models/post.ts** - Modelo de Dados

**Propósito**: Definir estrutura de dados TypeScript.

```typescript
import { ObjectId } from "mongodb";

export interface Post {
  _id?: ObjectId;      // ID do MongoDB (opcional ao criar)
  title: string;       // Obrigatório
  content: string;     // Obrigatório
  author?: string;     // Opcional (default: "Anonymous")
  createdAt?: Date;    // Timestamp de criação
  updatedAt?: Date;    // Timestamp de atualização
}
```

**Por Que ObjectId e Não String?**:
```typescript
// ❌ Errado
_id?: string;

// ✅ Correto
_id?: ObjectId;
```

**Motivo**:
- MongoDB usa `ObjectId` internamente
- TypeScript precisa do tipo correto
- Evita erros de conversão
- Permite métodos como `.toString()`

**Uso Prático**:
```typescript
// Criar post (sem _id)
const newPost: Post = {
  title: "Meu Post",
  content: "Conteúdo...",
};

// MongoDB adiciona _id automaticamente
const result = await collection.insertOne(newPost);
console.log(result.insertedId); // ObjectId("...")

// Buscar post (com _id)
const post = await collection.findOne({ 
  _id: new ObjectId("673dac96...") 
});
```

---

### 4. **Utils/logger.ts** - Sistema de Logs

**Propósito**: Logs coloridos e padronizados.

```typescript
export function logInfo(...msg: any[]) {
  console.log("\x1b[32m[INFO]\x1b[0m", ...msg);
  //          ^^^^^^^^ Verde   ^^^^^^^ Reset
}

export function logError(...msg: any[]) {
  console.error("\x1b[31m[ERROR]\x1b[0m", ...msg);
  //            ^^^^^^^^ Vermelho
}

export function logWarn(...msg: any[]) {
  console.warn("\x1b[33m[WARN]\x1b[0m", ...msg);
  //           ^^^^^^^^ Amarelo
}
```

**Códigos ANSI**:
- `\x1b[32m` = Verde
- `\x1b[31m` = Vermelho
- `\x1b[33m` = Amarelo
- `\x1b[0m` = Reset (volta ao normal)

**Uso**:
```typescript
logInfo("✅ Servidor iniciado");
// Output: [INFO] ✅ Servidor iniciado (em verde)

logError("❌ Falha na conexão", error);
// Output: [ERROR] ❌ Falha na conexão (em vermelho)
```

---

Continua na **DOCUMENTACAO-PARTE2.md**...
