# Contributing to AI Scrum Assistant

Thank you for your interest in contributing! This document covers everything you need to get started — from setting up your environment to submitting a polished PR.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Common Pitfalls](#common-pitfalls)

---

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, inclusive, and respectful environment. Be kind, constructive, and assume good intent.

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| pnpm | 8+ | Server package manager |
| MongoDB | 6+ | Database (local or Atlas) |
| Docker | latest | ChromaDB, Redis |
| Google Gemini API Key | — | LLM for agents |
| Atlassian Developer Account | — | Jira OAuth |

### Local Setup

**1. Fork & Clone**

```bash
git clone https://github.com/<your-username>/AI-Scrum-Assistant.git
cd AI-Scrum-Assistant
```

**2. Start Infrastructure**

```bash
# ChromaDB (vector database)
docker run -d --name chroma -p 8000:8000 chromadb/chroma

# Redis (queue backend)
docker run -d --name redis -p 6379:6379 redis:alpine
```

**3. Install Dependencies**

```bash
# Server
cd server
pnpm install

# Client
cd ../client
npm install
```

**4. Configure Environment**

Create `server/.env`:

```env
PORT=2000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=jira_app
JWT_SECRET=your-secure-random-string
ATLASSIAN_CLIENT_ID=your_atlassian_client_id
ATLASSIAN_CLIENT_SECRET=your_atlassian_client_secret
ATLASSIAN_REDIRECT_URI=http://localhost:5173/oauth/callback
FRONTEND_SUCCESS_URL=http://localhost:5173/oauth/success
GOOGLE_API_KEY=your_google_api_key
REDIS_URL=redis://localhost:6379
CHROMA_URL=http://localhost:8000
```

**5. Run**

```bash
# Terminal 1: Server
cd server && pnpm run dev

# Terminal 2: Client
cd client && npm run dev
```

Access at `http://localhost:5173`.

---

## Project Architecture

The server follows a **3-layer architecture**:

```
server/src/
├── integrations/jira/    ← JIRA LAYER (single gateway for all JIRA calls)
│   ├── controllers/      # JIRA-specific controllers
│   ├── routes/           # JIRA-specific routes
│   └── services/         # jiraClient, transformers, pushWorker
│
├── services/
│   ├── ai/               ← AGENT LAYER (LLM, RAG, tools)
│   ├── automation/       # Standup, retro generation
│   └── pushWorker        # Background queue processing
│
├── backlog-generator/    ← AGENT LAYER (LangGraph pipeline)
│   ├── nodes/            # Pipeline stages
│   ├── prompts/          # LLM prompt templates
│   └── schemas/          # Output schemas
│
├── controllers/          ← CORE SERVICE LAYER (business logic)
├── routes/               ← CORE SERVICE LAYER (API routes)
├── models/               # Mongoose schemas
├── config/               # DB, Redis, JWT config
├── middleware/            # Auth middleware
└── utils/                # Shared utilities
```

### Where Does My Code Go?

| What you're building | Where it goes |
|---------------------|---------------|
| New JIRA API integration | `integrations/jira/services/` |
| New JIRA endpoint | `integrations/jira/controllers/` + `routes/` |
| New AI/LLM feature | `services/ai/` |
| New LangGraph node | `backlog-generator/nodes/` |
| New business endpoint | `controllers/` + `routes/` |
| New Mongoose model | `models/` |
| Shared utility | `utils/` |

### Key Rules

1. **Never use raw axios for JIRA calls.** Use `getJiraClient()` + `searchIssues()` / `createIssue()` from `integrations/jira/services/jiraClient.js`.
2. **Never import across layers randomly.** Controllers import from services. Services import from models. The JIRA layer is self-contained.
3. **No mid-file imports.** All `import` statements go at the top of the file.

---

## Development Workflow

### 1. Find or Create an Issue

Check the [Issue Tracker](https://github.com/anudeepmuppalla1729/AI-Scrum-Assistant/issues) first. If nobody is working on it, claim it. If the issue doesn't exist, create one.

### 2. Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Branch naming:
- `feature/` — new functionality
- `fix/` — bug fixes
- `refactor/` — code restructuring
- `docs/` — documentation only
- `test/` — adding or fixing tests

### 3. Make Changes

- Keep PRs focused — one concern per PR
- Follow existing patterns (see [Coding Standards](#coding-standards))
- Add tests for new logic (see [Testing](#testing))

### 4. Test Before Submitting

```bash
cd server

# Always run unit tests
npm run test:unit

# If you touched infrastructure config
npm run test:health

# If you changed controllers or services
npm run test:integration
```

### 5. Submit a Pull Request

See [Pull Request Process](#pull-request-process).

---

## Testing

### Test Framework

We use **Node.js built-in test runner** (`node:test`) with `node:assert/strict`. No external test framework needed.

### Running Tests

```bash
cd server

npm test                  # Default: unit tests + rag-context
npm run test:unit         # Unit tests only (no services needed)
npm run test:health       # Infrastructure health checks
npm run test:integration  # Integration tests with mocks
npm run test:all          # Everything
```

### Writing Unit Tests

Unit tests live in `test/unit/` and test **pure logic** — no database, no API calls.

```js
// test/unit/myModule.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { myFunction } from "../../src/path/to/myModule.js";

describe("myFunction", () => {
  it("returns expected output for valid input", () => {
    const result = myFunction("input");
    assert.equal(result, "expected");
  });

  it("throws on invalid input", () => {
    assert.throws(() => myFunction(null));
  });
});
```

**What to unit test:**
- Validation logic
- Data transformations
- Utility functions
- State reducers
- Schema validation (Zod)

### Writing Integration Tests

Integration tests live in `test/integration/` and test modules that depend on external services. Use the mock helpers in `test/helpers/`.

```js
// test/integration/myService.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMockJiraClient } from "../helpers/mockJiraClient.js";

describe("myService", () => {
  it("processes JIRA data correctly", async () => {
    const client = createMockJiraClient();
    // ... test with mock client
  });
});
```

### Writing Health Checks

Health checks verify that external services are reachable. Place them in `test/integration/health/`.

```js
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";

describe("MyService Health Check", () => {
  it("connects successfully", async () => {
    // ping, heartbeat, or simple query
  });

  after(async () => {
    // cleanup connections
  });
});
```

### Test Helpers

| Helper | Purpose |
|--------|---------|
| `mockReqRes.js` | Mock Express `req`, `res`, `next` objects |
| `mockJiraClient.js` | Mock `jira.js` client with configurable responses |
| `mockModels.js` | Mock Mongoose models with in-memory store |

---

## Coding Standards

### JavaScript (Server)

- **ES Modules** — use `import`/`export`, never `require()`
- **Top-level imports only** — no mid-file `import` statements
- **No raw axios for JIRA** — use `jiraClient.js` SDK helpers
- **Named exports** — prefer `export const myFunc` over `export default`
- **Error handling** — always catch and log, never swallow errors silently

```js
// ✅ Good
import { getJiraClient, searchIssues } from "../integrations/jira/services/jiraClient.js";

export const findIssues = async (req, res) => {
  try {
    const client = await getJiraClient(req.user);
    const { issues } = await searchIssues(client, { jql: '...' });
    res.json(issues);
  } catch (err) {
    console.error("Failed to find issues:", err.message);
    res.status(500).json({ error: err.message });
  }
};
```

```js
// ❌ Bad — raw axios, mid-file import, swallowed error
import axios from "axios";  // don't use raw axios for JIRA

export const findIssues = async (req, res) => {
  const resp = await axios.get(`${process.env.JIRA_HOST}/rest/api/3/search`, {
    headers: { Authorization: `Basic ${Buffer.from(...)}` }
  });
  // ...
};
```

### TypeScript (Client)

- Strict TypeScript — avoid `any`
- Define interfaces in `types/` folder
- Use Zustand for state management
- Follow existing component patterns

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Controller | `*.controller.js` | `backlog.controller.js` |
| Route | `*.routes.js` | `backlog.routes.js` |
| Service | `*.service.js` | `jiraClient.service.js` |
| Model | PascalCase | `GeneratedBacklog.js` |
| Test | `*.test.js` | `validation.test.js` |
| Prompt | `*.prompt.js` | `orchestrator.prompt.js` |
| Schema | `*.schema.js` | `storyOutput.schema.js` |

---

## Commit Guidelines

### Format

```
<type>: <short description>

<optional body explaining WHY, not WHAT>
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Dependencies, config, tooling |
| `perf` | Performance improvement |

### Examples

```
feat: add sprint velocity calculation to orchestrator node
fix: handle missing JIRA token in webhook controller
refactor: move pushWorker into JIRA integration layer
test: add validation rules for acceptance criteria blocklist
docs: add testing section to README
```

### Rules

- Use **present tense** ("Add feature" not "Added feature")
- Keep subject line under **72 characters**
- Reference issues when applicable (`Fixes #42`)

---

## Pull Request Process

### Before Opening a PR

- [ ] Code follows the style guide above
- [ ] All existing tests pass (`npm run test:unit`)
- [ ] New code has tests
- [ ] No raw axios calls for JIRA (use `jiraClient.js`)
- [ ] No mid-file imports
- [ ] Commit messages follow the convention

### PR Description Template

```markdown
## What
Brief description of the change.

## Why
Why this change is needed.

## How
How it works (if not obvious).

## Testing
How you verified it works.

## Screenshots
If UI changes, add before/after screenshots.

Fixes #<issue-number>
```

### Review Process

1. A maintainer will review your PR within a few days
2. Address any requested changes
3. Once approved, a maintainer will merge it
4. Your contribution will be included in the next release

---

## Common Pitfalls

### ❌ Using raw axios for JIRA

```js
// DON'T
const resp = await axios.get(`${JIRA_HOST}/rest/api/3/search`, {
  headers: { Authorization: `Basic ${auth}` }
});
```

```js
// DO
const client = await getJiraClient(req.user);
const { issues } = await searchIssues(client, { jql });
```

### ❌ Importing across layers incorrectly

```js
// DON'T — controller importing directly from JIRA internals
import { Version3Client } from "jira.js";
```

```js
// DO — use the JIRA layer's public API
import { getJiraClient } from "../integrations/jira/services/jiraClient.js";
```

### ❌ Forgetting to handle errors

```js
// DON'T
const result = await someAsyncCall();
```

```js
// DO
try {
  const result = await someAsyncCall();
} catch (err) {
  console.error("Failed:", err.message);
  res.status(500).json({ error: err.message });
}
```

### ❌ Adding tests that need running services without checking

```js
// DON'T — will fail if Redis isn't running
it("connects to Redis", async () => {
  const result = await redis.ping();
  assert.equal(result, "PONG");
});
```

```js
// DO — put in test/integration/health/, not test/unit/
```

---

## Questions?

Open an issue with the label `question` or start a discussion. We're happy to help!

Thank you for contributing! 🎉
