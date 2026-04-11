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
