# LLM-CMS - Content Management System via MCP

Sistema de gerenciamento de conteúdo controlado por LLMs através do **Model Context Protocol (MCP)**.

## 🎯 Objetivo

Permitir que Large Language Models (LLMs) gerenciem conteúdo de forma autônoma através de um servidor MCP integrado com MongoDB Atlas.

## 🏗️ Arquitetura

```
LLM-MCS/
├── src/
│   ├── Config/          # Configurações (variáveis de ambiente)
│   ├── DB/              # Conexão MongoDB
│   ├── Mcp/             # Implementação do servidor MCP
│   │   ├── index.ts     # Inicialização do servidor
│   │   ├── tools.ts     # Ferramentas CRUD
│   │   ├── resources.ts # Recursos expostos
│   │   └── prompts.ts   # Templates de prompts
│   ├── Models/          # Modelos de dados
│   ├── Utils/           # Utilitários (logger)
│   └── server.ts        # Entry point
├── .env                 # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

## 🚀 Funcionalidades

### Tools (Ferramentas)
O servidor expõe 5 ferramentas para LLMs:

1. **create_post** - Criar novo post
   - Parâmetros: `title`, `content`, `author` (opcional)
   
2. **list_posts** - Listar posts
   - Parâmetros: `limit` (padrão: 10)
   
3. **get_post** - Obter post específico
   - Parâmetros: `id`
   
4. **update_post** - Atualizar post
   - Parâmetros: `id`, `title` (opcional), `content` (opcional), `author` (opcional)
   
5. **delete_post** - Deletar post
   - Parâmetros: `id`

### Resources (Recursos)
Cada post é exposto como recurso acessível via URI:
- Formato: `post://<post_id>`
- Tipo MIME: `application/json`

### Prompts (Templates)
Templates pré-configurados para LLMs:

1. **create_blog_post** - Criar post estruturado
2. **summarize_posts** - Resumir posts existentes
3. **content_ideas** - Gerar ideias de conteúdo

## ⚙️ Configuração

### 1. Variáveis de Ambiente
Crie/edite o arquivo `.env`:

```env
PORT=3000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database
DB_NAME=LLM-CMS
```

### 2. Instalação
```bash
npm install
```

### 3. Desenvolvimento
```bash
npm run dev
```

### 4. Build
```bash
npm run build
npm start
```

## 📦 Dependências

- **@modelcontextprotocol/sdk** - SDK do Model Context Protocol
- **mongodb** - Driver MongoDB
- **dotenv** - Gerenciamento de variáveis de ambiente
- **typescript** - Linguagem TypeScript
- **tsx** - Executor TypeScript

## 🔌 Integração com LLMs

O servidor usa **stdio transport**, permitindo comunicação via stdin/stdout. Isso possibilita integração com:

- Claude Desktop
- Outros clientes MCP compatíveis

### Exemplo de configuração Claude Desktop:
```json
{
  "mcpServers": {
    "llm-cms": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "/caminho/para/LLM-MCS"
    }
  }
}
```

## 📊 Modelo de Dados

### Post
```typescript
interface Post {
  _id?: ObjectId;
  title: string;
  content: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🔐 Segurança

- ✅ Validação de variáveis de ambiente obrigatórias
- ✅ Tratamento de erros em todas as operações
- ✅ Logs estruturados com cores
- ⚠️ **Importante**: Não commitar `.env` com credenciais reais

## 📝 Logs

Sistema de logs coloridos:
- 🟢 **[INFO]** - Operações bem-sucedidas
- 🔴 **[ERROR]** - Erros
- 🟡 **[WARN]** - Avisos

## 🛠️ Desenvolvimento

### Estrutura de Código
- **Config/env.ts** - Carrega e valida variáveis de ambiente
- **DB/mongo.ts** - Gerencia conexão MongoDB
- **Mcp/tools.ts** - Implementa operações CRUD
- **Mcp/resources.ts** - Expõe posts como recursos
- **Mcp/prompts.ts** - Define templates para LLMs
- **Mcp/index.ts** - Orquestra servidor MCP

### Fluxo de Execução
1. `server.ts` inicia aplicação
2. `initMcpServer()` conecta ao MongoDB
3. Registra tools, resources e prompts
4. Conecta ao stdio transport
5. Aguarda requisições MCP

## 📚 Recursos Adicionais

- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contribuição

Este é um projeto da **NexelIT** para demonstrar integração LLM + MCP + MongoDB.

## 📄 Licença

ISC
