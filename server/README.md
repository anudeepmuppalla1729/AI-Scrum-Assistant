# AI Scrum Assistant Backend

This is the backend service for the AI Scrum Assistant, providing APIs for Jira integration, RAG (Retrieval-Augmented Generation), and automated reporting.

## Prerequisites

- Node.js (v18+)
- Docker (for ChromaDB)
- Jira Account & API Token
- Google Gemini API Key

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory and add the following:

    ```env
    PORT=2000
    JIRA_HOST=your-domain.atlassian.net
    JIRA_EMAIL=your-email@example.com
    JIRA_API_TOKEN=your-jira-api-token
    GEMINI_API_KEY=your-gemini-api-key
    ```

3.  **ChromaDB Setup (Docker):**
    The application requires a running ChromaDB instance to store and retrieve knowledge base vectors.

    Run the following command to start ChromaDB in a Docker container:

    ```bash
    docker run -d --name chroma -p 8000:8000 chromadb/chroma
    ```

    This will start the ChromaDB server on port 8000. The backend is configured to connect to `http://localhost:8000`.

    _To stop the container:_

    ```bash
    docker stop chroma
    ```

    _To start it again:_

    ```bash
    docker start chroma
    ```

## Running the Application

```bash
npm run dev
```

## API Endpoints

- **POST /api/v1/scrum/suggestions**: Upload a PRD (PDF) to generate ticket suggestions.
- **POST /api/v1/scrum/pushSuggestionsToJira**: Push generated suggestions to Jira.
- **POST /api/v1/scrum/chat**: Chat with the AI Scrum Master.
- **GET /api/v1/scrum/standup?projectKey=KEY**: Generate a Daily Standup report.
- **GET /api/v1/scrum/retrospective?sprintId=ID**: Generate a Sprint Retrospective report.
- **POST /api/v1/scrum/webhooks/jira**: Webhook endpoint for Jira events.

## ChromaDB Collection Strategy (Per Jira Board)

RAG data is now isolated per Jira board:

- Legacy shared collection: `scrum_knowledge_base_v2`
- Board collections: `scrum_knowledge_base_board_<boardId>`

### Retrieval behavior

- If a `boardId` is available in request context (chat workspace, PRD upload, webhook/automation context), RAG queries target the corresponding board collection.
- For backward compatibility, board-scoped queries fallback to the legacy shared collection when the board collection has no matches.
- If no board context is provided, the legacy shared collection is used.

### Migration from shared to board collections

Use the migration script to move existing legacy data:

```bash
npm run migrate:rag:boards -- --defaultBoardId=123
```

Optional flags:

- `--dryRun=true` to preview without writing
- `--batchSize=200` to tune migration batch size

Notes:

- Records that already contain `metadata.boardId` are routed to that board's collection.
- Records without `boardId` are assigned to `--defaultBoardId` (or skipped if none is provided).
- Collection handles are cached in-process to avoid repeated collection creation lookups for high board counts.

### Compatibility / Breaking Changes

- No hard breaking change for existing data: legacy collection fallback is still enabled.
- Recommended migration path is to run the migration script and then rely on board-scoped retrieval for best isolation.
