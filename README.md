# AI Scrum Assistant

_A Multi-Agent, AI-Powered Scrum Companion for Jira

> A full-stack, agentic AI system that automates backlog refinement, PRD parsing, sprint planning, and chat-based agile management — built with Node.js, LangChain.js, Google Gemini, Mongoose, Jira OAuth (3LO), and a modern React 19 frontend.

---

## 🎯 Overview

The **AI Scrum Assistant** is a modern, multi-agent application designed to act as a *virtual Scrum Master*. By leveraging LLMs alongside your Jira workspace, it minimizes administrative overhead, helping Agile teams focus on delivering value rather than writing tickets or analyzing sprint metrics manually.

### Core Value Proposition

- **Zero-Friction Authentication**: Uses native Atlassian OAuth 2.0 (3LO) for secure, token-less sign-ins and multi-workspace support.
- **Document to Backlog Generation**: Converts Product Requirement Documents (PRDs) including PDFs into actionable, hierarchical Jira Epics, Stories, and Tasks with one click.
- **Context-Aware AI Chat**: Engage with an intelligent assistant to summarize sprints, query tickets, or debug Agile blockers, featuring saved sessions.
- **Sprint Intelligence**: Delivers sprint metrics, daily standup summaries, and AI-driven retrospective reports based on historical Jira operations.

---

## 🏗️ Core Architecture & Tech Stack

The system follows a modern MERN-like stack supercharged by specialized AI orchestration agents.

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **UI Icons & Markdown**: Lucide React, React Markdown

### Backend
- **Framework**: Node.js + Express (ESM)
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & Atlassian OAuth (3LO)
- **API Clients**: `jira.js` for robust REST API interaction

### AI Layer
- **Orchestration**: LangChain.js (`@langchain/core`, `@langchain/langgraph`)
- **LLM Providers**: Google Gemini (`@langchain/google-genai`), OpenRouter
- **Vector Database**: ChromaDB (via LangChain for RAG and semantic duplicate detection)
- **Parsers**: Zod (for structured outputs), `pdf-parse`

---

## 🌟 Key Features

1. **Atlassian OAuth Integration**
   - Securely log in using your Jira account.
   - Seamlessly switch between different Atlassian Cloud workspaces/boards.

2. **PRD → Jira Ticket Generation Dashboard**
   - Upload textual or PDF-based PRDs.
   - AI automatically extracts and structures requirements into Jira hierarchies (Epics → Stories → Tasks).
   - Review, modify, and push the generated tickets directly to your Jira backlog using a Human-in-the-Loop UI.
   - Persisted PRD generation sessions via MongoDB.

3. **Intelligent Chatbot Interface**
   - A dedicated Chat space to ask the AI questions about your Jira projects.
   - Chat history and separated sessions are saved so you never lose context.

4. **Agile Reporting & Sprint Planning**
   - Extracts sprint issues to calculate velocity, completion rates, and spillovers.
   - **Daily Standups**: AI-generated standup reports synthesizing recent Jira status changes and comments.
   - **Retrospectives**: Automated "What Went Well" and "Actionable Insights" structured templates analyzing closed sprints.

---

## 🔐 Setup & Installation

### Prerequisites
- **Node.js**: v18 or higher recommended.
- **MongoDB**: A local instance or MongoDB Atlas cluster.
- **Docker**: For running the ChromaDB vector server.
- **Atlassian Developer App**: An app created in Atlassian Developer console with OAuth 2.0 (3LO) integration and required Jira REST API scopes.
- **AI Keys**: A Google Gemini API Key and/or OpenRouter API Key.

### 1. Vector Database Setup
The AI semantic search modules rely on ChromaDB. Run ChromaDB using Docker on port 8000:
```bash
docker run -d --name chroma -p 8000:8000 chromadb/chroma
```
*(To stop: `docker stop chroma` | To start again: `docker start chroma`)*

### 2. Environment Variables
Create a `.env` file in the `backend/` directory based on the following template:

```env
# Server Configuration
PORT=2000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster...
DB_NAME=ass-project

# Authentication 
JWT_SECRET=YOUR_SECURE_JWT_SECRET

# Atlassian OAuth Application Credentials (3LO)
ATLASSIAN_CLIENT_ID=your_atlassian_client_id
ATLASSIAN_CLIENT_SECRET=your_atlassian_client_secret
ATLASSIAN_REDIRECT_URI=http://localhost:5173/oauth/callback
FRONTEND_SUCCESS_URL=http://localhost:5173/oauth/success

# AI LLM Services
GOOGLE_API_KEY=your_google_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional legacy Jira settings
JIRA_STORY_POINTS_FIELD=customfield_10016
JIRA_EPIC_NAME_FIELD_ID=customfield_10011
```

### 3. Application Initialization
Clone the repository and set up the independent frontend and backend services.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Access the application in your browser at `http://localhost:5173` (or the port Vite designates).

---

## 📂 Project Structure

```text
ai-scrum-assistant/
├── backend/                  # Orchestration, AI logic, and APIs
│   ├── src/
│   │   ├── controllers/      # Route logic handlers
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # Modular services
│   │   │   ├── ai/           # LangChain flows, chatbot, PRD parsers
│   │   │   ├── automation/   # (Reserved for automations)
│   │   │   └── jira/         # Jira API wrappers & agile metrics
│   │   ├── index.js          # App initialization
│   │   └── ...
│   ├── .env                  # Backend configuration
│   └── package.json
│
├── frontend/                 # React 19 Client
│   ├── src/
│   │   ├── components/       # Reusable UI parts & layouts
│   │   ├── pages/            # Core views (Dashboard, Chat, PRDGenerator, Sprint)
│   │   ├── store/            # Zustand global stores
│   │   ├── hooks/            # Custom React Hooks
│   │   └── main.tsx          # React Root
│   └── package.json
│
└── README.md
```

---

## 🛣️ API Capabilities Snapshot
The backend securely interfaces via JWT authentication once logged in with OAuth.

- **OAuth**: `/api/v1/auth/jira/login`, `/api/v1/auth/jira/callback`
- **Jira Cloud/Agile**: `/api/v1/jira-cloud/cloud-id`, `/api/v1/jira-board/boards`, `/api/v1/jira-sprint/boards/:id/sprints`
- **Scrum AI Operations**: 
  - `POST /api/v1/scrum/suggestions` (RAG PRD parsing)
  - `POST /api/v1/scrum/pushSuggestionsToJira` (Creation logic)
  - `GET /api/v1/scrum/standup`
  - `GET /api/v1/scrum/retrospective`
- **Chat & Sessions**: `/api/v1/scrum/chat/session`, `/api/v1/scrum/chat/:sessionId/messages`

---

## 🤝 Contribution & License
This application is currently in development. Open to contributions!

**Author**: MAC (anudeepmuppalla@gmail.com)

---

## ChromaDB Per-Board Collections

RAG data is organized per Jira board to isolate context and improve retrieval relevance:

- Legacy collection: `scrum_knowledge_base_v2`
- Board-scoped collections: `scrum_knowledge_base_board_<boardId>`

When board context is available, retrieval queries use the matching board collection. A legacy fallback remains enabled for backward compatibility when board-scoped data is not available yet.

To migrate shared legacy data:

```bash
cd server
npm run migrate:rag:boards -- --defaultBoardId=<board-id>
```

Use `--dryRun=true` first to validate migration behavior without writes.
