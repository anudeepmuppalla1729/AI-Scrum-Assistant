# Contributing to AI Scrum Assistant

First off, thank you for considering contributing to the AI Scrum Assistant! It's because of the open-source community that we can build incredible AI tools for Agile teams.

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming, inclusive, and respectful environment for everyone. 

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local or Atlas)
- **Docker** (For ChromaDB)
- **Google Gemini API Key** (For Langchain agents)
- **Atlassian Developer Account** (For Jira OAuth integrations)

### Local Environment Setup
1. Fork the repository and clone it to your machine.
2. Start the ChromaDB vector database locally via Docker:
   ```bash
   docker run -d --name chroma -p 8000:8000 chromadb/chroma
   ```
3. Set up the Backend:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file (refer to the README for required variables) and start the server:
   ```bash
   npm run dev
   ```
4. Set up the Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Development Workflow

### 1. Find or Create an Issue
Before writing code, please check the [Issue Tracker](https://github.com/anudeepmuppalla1729/AI-Scrum-Assistant/issues) to ensure no one else is already working on the same thing. If you find a bug or have a feature idea, please open an issue first to discuss it with the maintainers.

### 2. Create a Branch
Use a descriptive branch name branching off of `main`:
```bash
git checkout -b feature/add-new-sprint-metric
# or
git checkout -b fix/chat-agent-memory
```

### 3. Make Your Changes
- **Backend:** We use standard Express modular routing with Mongoose. AI orchestration happens in `backend/src/services/ai` using LangChain and LangGraph.
- **Frontend:** We use React 19, Vite, Tailwind CSS v4, and Zustand for state. Please follow existing patterns.
- Keep pull requests small and focused on a single issue.

### 4. Test Your Code
Ensure that everything functions properly from end-to-end. If you are modifying the LangGraph agents, verify that Jira formatting and RAG retrieval still work accurately.

### 5. Submit a Pull Request
When you are ready:
1. Push your branch to your fork.
2. Open a Pull Request from your fork to our `main` branch.
3. Include a clear, detailed description of your changes.
4. If your PR resolves an open issue, link it (e.g., `Fixes #42`).

## Coding Styleguides

### Git Commits
- Use present tense ("Add feature" not "Added feature").
- Limit the first line (subject) to 72 characters or less.
- Provide a detailed body if the context is complex.

### JavaScript & TypeScript
- The frontend strictly uses **TypeScript**. Please avoid using `any` and define proper interfaces in the `types/` folder.
- The backend uses modern **ES Modules** (`import`/`export`). 
- Follow standard ESLint rules provided in the repository.

Thank you for helping us make the AI Scrum Assistant better!
