# AI Scrum Assistant - Server Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components & Data Flow](#core-components--data-flow)
5. [API Endpoints](#api-endpoints)
6. [Database Models](#database-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI Services & LangChain Integration](#ai-services--langchain-integration)
9. [Vector Database (ChromaDB) Integration](#vector-database-chromadb-integration)
10. [Jira Integration](#jira-integration)
11. [File Connections & Dependencies](#file-connections--dependencies)
12. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

The **AI Scrum Assistant Server** is a Node.js/Express-based backend that serves as the central hub for an AI-powered Agile team assistant. It integrates with **Jira Cloud**, **Atlassian OAuth**, **Google Gemini LLM**, **ChromaDB (vector database)**, and **MongoDB** to provide:

- **PRD-to-Jira Automation**: Upload PDFs, extract requirements, generate hierarchical Jira tickets
- **Intelligent Chatbot**: Query project knowledge, search backlogs, craft backlog items with AI assistance
- **Agile Reporting**: Daily standups, sprint retrospectives, velocity analytics
- **Knowledge Management**: Store and retrieve project context via semantic search (RAG)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js (v18+) | JavaScript runtime |
| **Web Framework** | Express.js | HTTP server & routing |
| **Database** | MongoDB + Mongoose | User sessions, chat history, PRD sessions |
| **Vector DB** | ChromaDB (Docker) | Semantic search for PRDs, tickets, sprints |
| **AI/LLM** | Google Gemini 2.5 Flash | Primary LLM via LangChain |
| **Agent Framework** | LangChain + LangGraph | AI agent orchestration with tool use |
| **Jira Integration** | jira.js SDK + Axios | REST API calls to Jira Cloud |
| **PDF Parsing** | pdfreader | Extract text from PDF documents |
| **Auth** | JWT + Atlassian OAuth 2.0 (3LO) | User authentication & authorization |
| **Validation** | Zod | Schema validation for structured outputs |
| **Embeddings** | Google Generative AI Embeddings | Vector embeddings for semantic search |

---

## Directory Structure

```
server/
├── src/
│   ├── index.js                          # Entry point - start server
│   ├── server.js                         # Express app setup & routes
│   │
│   ├── config/
│   │   ├── db.js                         # MongoDB connection
│   │   └── jwt.js                        # JWT secret & expiry config
│   │
│   ├── middleware/
│   │   └── auth.js                       # JWT verification middleware
│   │
│   ├── routes/
│   │   ├── scrum.routes.js               # Main scrum API routes (PRD, chat, standup, retro)
│   │   ├── jira.routes.js                # Jira OAuth login/callback
│   │   ├── jiraCloud.routes.js           # Jira Cloud API proxies
│   │   ├── jiraBoard.routes.js           # Fetch Jira boards
│   │   ├── jiraSprint.routes.js          # Fetch sprints & sprint issues
│   │   ├── jiraIssue.routes.js           # Fetch/search Jira issues
│   │   └── jiraIssueCreate.routes.js     # Create Jira issues
│   │
│   ├── controllers/
│   │   ├── scrum.controller.js           # Main handlers: PRD generation, pushing to Jira, chat, standup, retro
│   │   ├── chat.controller.js            # Chat session & message handlers
│   │   ├── prd.controller.js             # PRD session CRUD
│   │   ├── jira.controller.js            # OAuth flow handlers
│   │   ├── jiraBoard.controller.js       # Board fetch handlers
│   │   ├── webhook.controller.js         # Jira webhook event processing
│   │   └── backlog.controller.js         # Backlog search & push handlers
│   │
│   ├── models/
│   │   ├── User.js                       # User document (Jira auth tokens)
│   │   ├── ChatSession.js                # Chat conversation sessions
│   │   ├── ChatMessage.js                # Individual chat messages
│   │   └── PRDSession.js                 # PRD generation session tracking
│   │
│   ├── services/
│   │   ├── ai/                           # AI & LLM services
│   │   │   ├── model.service.js          # Gemini LLM initialization
│   │   │   ├── agent.service.js          # LangChain agent setup with tools
│   │   │   ├── chatbot.service.js        # Chat interaction with AI
│   │   │   ├── prdToTickets.service.js   # PRD → Jira schema conversion
│   │   │   ├── rag.service.js            # ChromaDB vector store operations
│   │   │   ├── rag.context.js            # Board-scoped collection management
│   │   │   └── tools/
│   │   │       ├── rag.tool.js           # Knowledge base search tool
│   │   │       └── backlog.tool.js       # Jira backlog search tool
│   │   │
│   │   ├── jira/                         # Jira API services
│   │   │   ├── jiraClient.js             # Jira Version3Client factory & token refresh
│   │   │   ├── issue_service.js          # Issue search via JQL
│   │   │   └── transformers/
│   │   │       ├── hierarchy.service.js  # Epic→Story→Task creation with retry logic
│   │   │       └── ticketTransformer.service.js  # Convert AI suggestions to Jira payloads
│   │   │
│   │   └── automation/
│   │       └── automation.service.js     # Standup & retrospective generation
│   │
│   ├── utils/
│   │   ├── schemas.js                    # Zod schemas for validation
│   │   └── generateToken.js              # JWT token creation
│   │
│   ├── swagger.js                        # OpenAPI/Swagger documentation
│   └── constants/ (if any)               # Config constants

package.json                              # Dependencies & scripts
.env.example                              # Environment template
```

---

## Core Components & Data Flow

### 1. **Authentication & Session Management**

```
User Login (Atlassian OAuth)
    ↓
jira.controller.startJiraAuth()
    ↓ (redirects to Atlassian)
User authorizes on Atlassian
    ↓
jira.controller.jiraCallback()
    ├── Exchange auth code for tokens
    ├── Fetch user profile & cloudId
    ├── Save/Update User in MongoDB (Jira tokens)
    └── Generate internal JWT token
    ↓
Frontend stores JWT in localStorage
    ↓
All API requests use: Authorization: Bearer <JWT>
    ↓
middleware/auth.js verifies JWT
    ├── Extracts user info
    └── Attaches req.user (decoded JWT payload)
```

**Key Files:**
- `server/src/routes/jira.routes.js` - OAuth endpoints
- `server/src/controllers/jira.controller.js` - OAuth logic
- `server/src/models/User.js` - User document schema
- `server/src/middleware/auth.js` - JWT verification
- `server/src/utils/generateToken.js` - JWT creation

---

### 2. **PRD → Jira Ticket Generation Pipeline**

```
Frontend uploads PDF
    ↓
POST /api/v1/scrum/suggestions (with file)
    ↓
scrum.controller.generateSuggestions()
    ├── Extracts PDF text
    ├── Calls getSuggestionsFromPRD()
    │   ├── Sends PRD text + Scrum guidelines to Gemini
    │   ├── Gemini returns structured JSON (Epics → Stories → Tasks)
    │   ├── Validates against PRDParserSchema (Zod)
    │   └── Upserts PRD to ChromaDB for future RAG
    └── Returns AI-generated hierarchy to frontend
    ↓
Frontend displays suggestions for review/edit
    ↓
User clicks "Push to Jira"
    ↓
POST /api/v1/scrum/pushSuggestionsToJira
    ↓
scrum.controller.pushAISuggestionsToJira()
    ├── Validates payload against PushAISuggestionsBodySchema
    ├── Gets Jira client (with OAuth token refresh)
    ├── Calls pushAISuggestionsHierarchy()
    │   ├── Creates Epics (GET Epic type ID)
    │   ├── Creates Stories under each Epic (link via parent)
    │   └── Creates Subtasks under each Story (with retry logic)
    └── Returns created issue keys to frontend
```

**Key Files:**
- `server/src/controllers/scrum.controller.js` - Main handler
- `server/src/services/ai/prdToTickets.service.js` - PDF extraction & LLM call
- `server/src/utils/schemas.js` - Zod validation schemas
- `server/src/services/jira/transformers/hierarchy.service.js` - Jira creation logic
- `server/src/services/jira/jiraClient.js` - Jira client factory

---

### 3. **Chat with AI Agent (Backlog Crafting)**

```
Frontend sends chat message
    ↓
POST /api/v1/scrum/chat/:sessionId
    ↓
chat.controller.sendMessage()
    ├── Saves user message to ChatMessage
    ├── Retrieves full conversation history
    ├── Calls chatWithAI() (via chatbot.service.js)
    │   └── Invokes LangChain agent with tools
    │       ├── Tool 1: scrum_knowledge_search
    │       │   └── Queries ChromaDB for project context
    │       │       (PRDs, sprints, tickets)
    │       │
    │       └── Tool 2: jira_backlog_search
    │           └── Searches Jira for existing issues
    │               (to avoid duplication & suggest linking)
    │
    ├── Agent processes tools + Gemini reasoning
    ├── Returns AI-generated response (or backlog-json structure)
    └── Saves assistant message to ChatMessage
```

**Key Files:**
- `server/src/controllers/chat.controller.js` - Message handler
- `server/src/services/ai/chatbot.service.js` - AI invocation
- `server/src/services/ai/agent.service.js` - Agent setup with tools
- `server/src/services/ai/tools/rag.tool.js` - Knowledge search
- `server/src/services/ai/tools/backlog.tool.js` - Jira backlog search
- `server/src/services/ai/rag.service.js` - ChromaDB operations

---

### 4. **Agile Reporting (Standup & Retrospective)**

```
GET /api/v1/scrum/standup?projectKey=PROJ
    ↓
scrum.controller.getDailyStandupReport()
    ├── Gets Jira client
    ├── Calls generateDailyStandup()
    │   ├── Fetches active sprint issues via JQL
    │   ├── Categorizes by status (Done, In Progress, Blocked)
    │   ├── Sends to Gemini with categorization
    │   └── Returns prose summary (Yesterday → Today → Blockers)
    └── Returns report to frontend

GET /api/v1/scrum/retrospective?sprintId=X
    ↓
scrum.controller.getSprintRetrospectiveReport()
    ├── Gets Jira client
    ├── Calls generateSprintRetrospective()
    │   ├── Fetches all sprint issues
    │   ├── Calculates metrics (velocity, completion %, bugs, blocked)
    │   ├── Queries ChromaDB for sprint context (RAG)
    │   ├── Sends metrics + context to Gemini
    │   └── Returns structured report (What Went Well, Actionable Items)
    └── Returns report to frontend
```

**Key Files:**
- `server/src/controllers/scrum.controller.js` - Report handlers
- `server/src/services/automation/automation.service.js` - Report generation
- `server/src/services/jira/issue_service.js` - JQL search

---

## API Endpoints

### **Authentication**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| GET | `/auth/jira/login` | jira.controller.startJiraAuth | Redirect to Atlassian OAuth |
| GET | `/auth/jira/callback` | jira.controller.jiraCallback | OAuth callback, create JWT |

### **Scrum Main Features**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/v1/scrum/suggestions` | scrum.controller.generateSuggestions | Upload PRD, get AI suggestions |
| POST | `/api/v1/scrum/pushSuggestionsToJira` | scrum.controller.pushAISuggestionsToJira | Create Jira tickets from suggestions |
| GET | `/api/v1/scrum/standup?projectKey=X` | scrum.controller.getDailyStandupReport | Daily standup summary |
| GET | `/api/v1/scrum/retrospective?sprintId=X` | scrum.controller.getSprintRetrospectiveReport | Sprint retrospective report |

### **Chat Sessions**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| GET | `/api/v1/scrum/chat/sessions` | chat.controller.getSessions | List all sessions |
| POST | `/api/v1/scrum/chat/session` | chat.controller.createSession | Create new session |
| GET | `/api/v1/scrum/chat/:sessionId/messages` | chat.controller.getMessages | Get session messages |
| POST | `/api/v1/scrum/chat/:sessionId` | chat.controller.sendMessage | Send message, get AI response |
| PATCH | `/api/v1/scrum/chat/session/:sessionId` | chat.controller.renameSession | Rename session |
| DELETE | `/api/v1/scrum/chat/session/:sessionId` | chat.controller.deleteSession | Delete session |

### **PRD Sessions**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| GET | `/api/v1/scrum/prd/sessions` | prd.controller.getPRDSessions | List PRD sessions |
| POST | `/api/v1/scrum/prd/session` | prd.controller.createPRDSession | Create session |
| GET | `/api/v1/scrum/prd/session/:sessionId` | prd.controller.getPRDSession | Get session details |
| PATCH | `/api/v1/scrum/prd/session/:sessionId` | prd.controller.updatePRDSession | Update session |
| DELETE | `/api/v1/scrum/prd/session/:sessionId` | prd.controller.deletePRDSession | Delete session |

### **Backlog Management**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/v1/scrum/backlog/push` | backlog.controller.pushBacklogItem | Create custom backlog item in Jira |
| GET | `/api/v1/scrum/backlog/history` | backlog.controller.getPushHistory | List created backlog items |
| GET | `/api/v1/scrum/backlog/search` | backlog.controller.searchBacklog | Search Jira for parent linking |

### **Jira Integrations**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/auth/jira/boards` | Fetch user's Jira boards |
| GET | `/auth/jira/boards/:boardId/sprints` | Fetch sprints for board |
| GET | `/auth/jira/sprints/:sprintId/issues` | Fetch sprint issues |
| POST | `/auth/jira/issues` | Create Jira issue |
| GET | `/auth/jira/issues/search` | Search issues |

### **Webhooks**
| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/v1/scrum/webhooks/jira` | webhook.controller.handleJiraWebhook | Real-time Jira event updates |

---

## Database Models

### **User.js**
Stores authenticated user credentials and Jira tokens.

```javascript
{
  email: String (unique),
  atlassianAccountId: String (unique, sparse),
  displayName: String,
  cloudId: String,
  jiraTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### **ChatSession.js**
Groups chat messages into named sessions.

```javascript
{
  userId: ObjectId (ref: User),
  title: String (e.g., "Feature discussion"),
  messages: [ObjectId] (ref: ChatMessage),
  createdAt: Date,
  updatedAt: Date
}
```

### **ChatMessage.js**
Individual chat turn (user or assistant).

```javascript
{
  sessionId: ObjectId (ref: ChatSession),
  role: String (enum: "user", "assistant"),
  content: String,
  createdAt: Date
}
```

### **PRDSession.js**
Tracks PRD upload & generation sessions for persistence.

```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  prompt: String (user focus instructions),
  epics: Array (AI-generated Epic objects),
  options: Object,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication & Authorization

### **OAuth 2.0 Flow (Atlassian 3LO)**

1. **Initiation**: User clicks "Login with Jira" → redirects to `/auth/jira/login`
2. **Atlassian Auth Page**: User authorizes scopes (read/write Jira, read profile, etc.)
3. **Callback**: Atlassian redirects to `/auth/jira/callback?code=...&state=...`
4. **Token Exchange**: Server exchanges `code` for `access_token` + `refresh_token`
5. **User Profile**: Server fetches user info from `/api/atlassian.com/me`
6. **Cloud ID**: Server fetches accessible Jira sites to get `cloudId`
7. **Database**: Saves/updates User with Jira tokens in MongoDB
8. **Internal JWT**: Server generates internal JWT (for frontend session management)
9. **Redirect**: Redirects to frontend with JWT in query (`?token=...`)

### **Token Management**

- **Jira OAuth Token**: 1 hour expiry → automatically refreshed when within 5 minutes of expiry
- **Internal JWT**: 7 days expiry (configurable in `/config/jwt.js`)
- **Refresh**: `ensureValidJiraToken()` in `jiraClient.js` handles automatic refresh

**Key Files:**
- `server/src/controllers/jira.controller.js` - OAuth flow
- `server/src/services/jira/jiraClient.js` - Token refresh logic
- `server/src/middleware/auth.js` - JWT verification

---

## AI Services & LangChain Integration

### **Model Service** (`model.service.js`)
Initializes Google Gemini 2.5 Flash with:
- Temperature: 0.4 (deterministic but creative)
- Max tokens: 8192
- Embeddings: Google Generative AI (for RAG)

### **Agent Service** (`agent.service.js`)
Sets up LangChain agent with:
1. **System Prompt**: Defines AI as Scrum Master & backlog crafting partner
2. **Tools**:
   - `scrum_knowledge_search`: Query ChromaDB for project context
   - `jira_backlog_search`: Search Jira for existing issues
3. **Reasoning**: Agent decides when to use each tool
4. **Output**: Conversational response OR `\`\`\`backlog-json ... \`\`\`` structured backlog item

### **Chatbot Service** (`chatbot.service.js`)
Wraps agent invocation with:
- Conversation history management
- Message normalization (LangChain may return arrays of content blocks)
- Error handling

### **RAG Service** (`rag.service.js`)
Manages ChromaDB vector store:
- **Collections**: Board-scoped (`scrum_knowledge_base_board_<boardId>`) or legacy
- **Upsert Operations**: `upsertTicket()`, `upsertSprint()`, `upsertPRD()`
- **Query**: `queryKnowledgeBase(query, nResults, options)`
- **Embeddings**: Generated via Google Generative AI

**Key Files:**
- `server/src/services/ai/model.service.js`
- `server/src/services/ai/agent.service.js`
- `server/src/services/ai/chatbot.service.js`
- `server/src/services/ai/rag.service.js`

---

## Vector Database (ChromaDB) Integration

### **Purpose**
Store embeddings of PRDs, sprints, and tickets for semantic (similarity-based) search. Avoids keyword matching limitations.

### **Architecture**
- **Collections**: Board-scoped or shared legacy
  - `scrum_knowledge_base_board_<boardId>` (preferred, after migration)
  - `scrum_knowledge_base_v2` (legacy fallback for backward compatibility)

### **Data Types Stored**
1. **Tickets**: Issue key, summary, status, assignee, description, type
2. **Sprints**: Sprint name, state, goal, dates
3. **PRDs**: Chunked (1000 chars + 200 overlap) for better retrieval

### **Query Flow**
1. User asks: *"How do we handle authentication?"*
2. Query embedded via Google Generative AI Embeddings
3. ChromaDB finds similar chunks (cosine similarity)
4. Results formatted and returned to agent
5. Agent uses results to ground conversation

### **Key Functions**
- `getCollectionByName()`: Get or create collection
- `upsertTicket()`: Add/update ticket embedding
- `upsertSprint()`: Add/update sprint embedding
- `upsertPRD()`: Add/update PRD chunks
- `queryKnowledgeBase()`: Search similar documents

**Key Files:**
- `server/src/services/ai/rag.service.js` - ChromaDB operations
- `server/src/services/ai/rag.context.js` - Collection naming & board scoping

---

## Jira Integration

### **Client Factory** (`jiraClient.js`)

```javascript
getJiraClient(userObject) → Version3Client
├── Validates Jira OAuth tokens
├── Auto-refreshes if near expiry (within 5 min)
├── Returns configured jira.js client for API calls
└── Throws error if tokens invalid or user not authenticated
```

### **Key Operations**

#### **1. Create Hierarchy (Epic → Story → Subtask)**
```javascript
pushAISuggestionsHierarchy({
  client,
  projectKey: "PROJ",
  suggestions: { data: { epics: [...] } }
})
├── For each Epic:
│   ├── Resolve Epic issue type ID
│   ├── Create Epic via POST /issues
│   └── For each Story under Epic:
│       ├── Resolve Story issue type ID
│       ├── Create Story with parent link (Epic ID)
│       └── For each Subtask under Story:
│           ├── Resolve Subtask type ID
│           ├── Create Subtask with parent link (Story ID)
│           └── Retry on 429/5xx (exponential backoff)
└── Return { success, created, errors }
```

#### **2. Search Issues (JQL)**
```javascript
search(client, jqlString) → issues[]
├── Executes: POST /rest/api/3/search/jql
├── Returns: Issues matching JQL query
└── Used for: Sprint issues, backlog search, standup categorization
```

#### **3. Fetch Boards & Sprints**
```javascript
/auth/jira/boards → boards[]
/auth/jira/boards/:boardId/sprints → sprints[]
/auth/jira/sprints/:sprintId/issues → issues[]
└── Via Jira Agile REST API (parallel to core API)
```

### **Retry Logic**
- Handles 429 (rate limit) and 5xx errors
- Exponential backoff: base delay 500ms, up to 3 retries
- Respects `Retry-After` header if provided

**Key Files:**
- `server/src/services/jira/jiraClient.js` - Client & token management
- `server/src/services/jira/issue_service.js` - JQL search
- `server/src/services/jira/transformers/hierarchy.service.js` - Issue creation
- `server/src/services/jira/transformers/ticketTransformer.service.js` - Payload formatting

---

## File Connections & Dependencies

### **High-Level Dependency Graph**

```
index.js (entry point)
└── server.js (Express app)
    ├── routes/
    │   ├── scrum.routes.js
    │   │   ├── controllers/scrum.controller.js
    │   │   │   ├── services/ai/prdToTickets.service.js
    │   │   │   │   ├── services/ai/rag.service.js
    │   │   │   │   └── utils/schemas.js (Zod)
    │   │   │   ├── services/jira/transformers/hierarchy.service.js
    │   │   │   │   ├── services/jira/jiraClient.js
    │   │   │   │   └── services/jira/transformers/ticketTransformer.service.js
    │   │   │   ├── controllers/chat.controller.js
    │   │   │   │   └── services/ai/chatbot.service.js
    │   │   │   │       ├── services/ai/agent.service.js
    │   │   │   │       │   ├── services/ai/model.service.js
    │   │   │   │       │   └── services/ai/tools/
    │   │   │   │       │       ├── rag.tool.js (search knowledge)
    │   │   │   │       │       └── backlog.tool.js (search Jira)
    │   │   │   │       └── services/ai/rag.service.js
    │   │   │   └── services/automation/automation.service.js
    │   │   │       ├── services/jira/issue_service.js
    │   │   │       ├── services/ai/rag.service.js
    │   │   │       └── services/ai/model.service.js
    │   │   ├── middleware/auth.js (JWT verification)
    │   │   └── models/
    │   │       ├── ChatSession.js
    │   │       ├── ChatMessage.js
    │   │       └── PRDSession.js
    │   │
    │   ├── jira.routes.js
    │   │   └── controllers/jira.controller.js
    │   │       ├── models/User.js
    │   │       └── utils/generateToken.js
    │   │
    │   └── [other jira routes]
    │       └── controllers/[jiraBoard, etc].controller.js
    │           └── services/jira/jiraClient.js
    │
    ├── config/db.js (MongoDB connection)
    └── swagger.js (OpenAPI setup)
```

### **Critical Connections**

| Source → Target | Purpose |
|-----------------|---------|
| **scrum.controller.js** → **prdToTickets.service.js** | PRD text extraction & LLM call |
| **prdToTickets.service.js** → **rag.service.js** | Store PRD in ChromaDB |
| **scrum.controller.js** → **hierarchy.service.js** | Create Jira issues from AI output |
| **hierarchy.service.js** → **jiraClient.js** | Get authenticated Jira client |
| **chat.controller.js** → **chatbot.service.js** | Process chat & invoke agent |
| **chatbot.service.js** → **agent.service.js** | Setup & invoke LangChain agent |
| **agent.service.js** → **rag.tool.js** + **backlog.tool.js** | Agent tools for search |
| **rag.tool.js** → **rag.service.js** | Query ChromaDB |
| **backlog.tool.js** → **issue_service.js** | Search Jira via JQL |
| **automation.service.js** → **issue_service.js** | Fetch sprint issues for reports |
| **automation.service.js** → **rag.service.js** | Fetch context for retrospectives |

---

## Data Flow Diagrams

### **1. PRD Upload & Jira Creation Flow**

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                            │
│ 1. User selects PRD file                                           │
│ 2. Clicks "Generate Suggestions"                                    │
└────────────────────┬────────────────────────────────────────────────┘
                     │ POST /api/v1/scrum/suggestions (multipart/form-data)
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: scrum.controller.generateSuggestions()                    │
│ - Extract PDF buffer from request                                   │
│ - Call getSuggestionsFromPRD(pdfBuffer, userPrompt, boardId)       │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ SERVICE: prdToTickets.service.js                                   │
│ 1. Extract text from PDF (pdfreader)                               │
│ 2. Upsert PRD text to ChromaDB (rag.service.upsertPRD)            │
│ 3. Build prompt with Scrum guidelines + PRD text                   │
│ 4. Call Gemini with structured output (PRDParserSchema)           │
│ 5. Validate JSON against Zod schema                                │
│ 6. Return structured epics/stories/subtasks                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ RESPONSE: JSON (epics + stories + subtasks)                        │
│ {                                                                   │
│   epics: [                                                          │
│     {                                                               │
│       title: "User Authentication",                                │
│       issues: [                                                     │
│         {                                                           │
│           type: "Story",                                            │
│           summary: "As a user, I want to log in...",              │
│           sub_issues: [...]                                        │
│         }                                                           │
│       ]                                                             │
│     }                                                               │
│   ]                                                                 │
│ }                                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                            │
│ - Display AI suggestions in editable UI                             │
│ - User reviews/edits suggestions                                    │
│ - User clicks "Push to Jira"                                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │ POST /api/v1/scrum/pushSuggestionsToJira
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: scrum.controller.pushAISuggestionsToJira()               │
│ - Validate payload (Zod)                                            │
│ - Get Jira client for authenticated user                            │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ SERVICE: hierarchy.service.pushAISuggestionsHierarchy()            │
│                                                                     │
│ ┌── For each Epic:                                                 │
│ │   ├── Resolve Epic issue type ID                                 │
│ │   ├── Create Epic (POST /issues)                                │
│ │   │   └── Epic created: PROJ-1                                  │
│ │   │                                                               │
│ │   └── For each Story under Epic:                                 │
│ │       ├── Resolve Story issue type ID                            │
│ │       ├── Create Story with parent=PROJ-1                       │
│ │       │   └── Story created: PROJ-2                             │
│ │       │                                                           │
│ │       └── For each Subtask under Story:                          │
│ │           ├── Resolve Subtask type ID                            │
│ │           ├── Create Subtask with parent=PROJ-2                 │
│ │           │   └── Subtask created: PROJ-3                       │
│ │           └── Retry on 429/5xx (exponential backoff)            │
│ │                                                                   │
│ └── Collect created issue keys & errors                            │
│                                                                     │
│ Return: { success, created, errors }                               │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ RESPONSE: Created issues                                            │
│ {                                                                   │
│   success: true,                                                    │
│   created: {                                                        │
│     epics: [{id, key, summary}],                                   │
│     stories: [{id, key, summary, parentEpicKey}],                  │
│     subtasks: [{id, key, summary, parentStoryKey}]                 │
│   },                                                                │
│   errors: []                                                        │
│ }                                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: Display success with Jira links                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### **2. Chat with AI Agent Flow**

```
┌──────────────────────────────────────────────┐
│ FRONTEND: User sends message in chat         │
└──────────────────┬──────────────────────────┘
                   │ POST /api/v1/scrum/chat/:sessionId
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ chat.controller.sendMessage()                                        │
│ 1. Verify session ownership (userId match)                          │
│ 2. Save user message to ChatMessage                                 │
│ 3. Fetch conversation history (ordered by createdAt)                │
│ 4. Call chatWithAI(message, history, userId, {boardId})            │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ chatbot.service.chatWithAI()                                         │
│ 1. Append user message to history                                    │
│ 2. Get agent (user-specific with backlog search)                     │
│ 3. Invoke agent.invoke({ messages }, { configurable })             │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ agent.service - LangChain Agent Loop                                │
│ 1. Gemini reads messages + system prompt                             │
│ 2. Decides: respond directly OR use tool?                            │
│                                                                       │
│ ┌─ If tool needed:                                                   │
│ │  ├─ Tool 1: scrum_knowledge_search (query ChromaDB)              │
│ │  │  ├── Call rag.service.queryKnowledgeBase(query)               │
│ │  │  └── Return relevant docs (PRDs, sprints, tickets)            │
│ │  │                                                                 │
│ │  └─ Tool 2: jira_backlog_search (search Jira for parents)        │
│ │     ├── Call backlog.tool (uses issue_service.search via JQL)    │
│ │     └── Return matching Epics, Stories, Tasks                     │
│ │                                                                     │
│ └─ Gemini reasons with tool results → generates response            │
│                                                                       │
│ 3. Return final message (may contain ```backlog-json``` block)      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ chat.controller.sendMessage() - resumed                              │
│ 1. Save assistant message to ChatMessage                             │
│ 2. Update session title if first interaction                         │
│ 3. Return both messages to frontend                                  │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                              │
│ Display assistant response (with backlog-json parsing if present)    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### **3. Agile Reporting Flow**

```
┌──────────────────────────────────────────────┐
│ FRONTEND: Click "Daily Standup" button        │
│ OR "Retrospective" button                      │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ↓                             ↓
GET /api/v1/scrum/standup    GET /api/v1/scrum/retrospective
?projectKey=PROJ             ?sprintId=X

    │                             │
    ↓                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ scrum.controller.getDailyStandupReport()                             │
│ 1. Get Jira client                                                   │
│ 2. Call automation.generateDailyStandup(client, projectKey)         │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ automation.service.generateDailyStandup()                             │
│ 1. Fetch active sprint issues (JQL: sprint in openSprints())        │
│ 2. Categorize by status:                                             │
│    - Done (completed yesterday)                                      │
│    - In Progress (working on today)                                  │
│    - Blocked (blockers)                                              │
│ 3. Build prompt with categorized issues                              │
│ 4. Call Gemini to generate prose summary                             │
│ 5. Return formatted report                                           │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ RESPONSE: Standup Report                                              │
│ "Yesterday we completed: [list]                                      │
│  Today working on: [list]                                            │
│  Blockers: [list]"                                                   │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ FRONTEND: Display report │
        └──────────────────────────┘

────────────────────────────────────────────────────────────

┌──────────────────────────────────────────────┐
│ RETROSPECTIVE PATH (similar but different)    │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ automation.service.generateSprintRetrospective()                      │
│ 1. Fetch all sprint issues (JQL: sprint = sprintId)                 │
│ 2. Calculate metrics:                                                │
│    - Planned story points (sum all)                                  │
│    - Completed story points (only Done status)                       │
│    - Bug count                                                       │
│    - Blocked count                                                   │
│ 3. Query ChromaDB for sprint context (RAG)                          │
│ 4. Build prompt with metrics + context                               │
│ 5. Call Gemini to generate:                                          │
│    - "What Went Well"                                                │
│    - "Actionable Insights"                                           │
│ 6. Return structured report                                          │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ RESPONSE: Retrospective Report                                        │
│ {                                                                     │
│   metrics: { plannedPoints, completedPoints, velocity, ...},        │
│   whatWentWell: "...",                                               │
│   actionableInsights: "..."                                          │
│ }                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ FRONTEND: Display report │
        └──────────────────────────┘
```

---

## Summary

The **AI Scrum Assistant Server** is a multi-layered system that orchestrates:

1. **User Authentication** via Atlassian OAuth
2. **AI-Powered Workflows** using LangChain agents & Google Gemini
3. **Jira Integration** for creating hierarchical issue structures
4. **Semantic Search** via ChromaDB for context-aware AI responses
5. **MongoDB Storage** for session history, chat logs, and PRD tracking
6. **Real-Time Agile Reporting** with metrics and AI synthesis

Each component is loosely coupled and communicates through well-defined APIs, making the system scalable and maintainable. The flow of data is unidirectional in most cases, with clear separation between controllers (request handlers), services (business logic), and models (data schema).
