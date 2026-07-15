# AI Scrum Assistant — LangGraph Agentic System

> **Purpose**: AI-powered Scrum assistant that transforms Product Requirement Documents (PRDs) into structured sprint backlogs. Built as a multi-agent LangGraph pipeline with concurrent execution, validation feedback loops, and Jira integration.

---

## 🏗️ System Overview

**Core Flow**: PRD + Business Docs + Jira → 2 Parallel Ingestion Nodes → Orchestrator → Router → N Concurrent Story Writers → Validation Loop → Assembler → MongoDB

### Pipeline Stages

```
Sprint Planning Input
├── PRD Document ──────────────┐
├── Supporting Business Docs ──┼──→ PRD Ingestion (parallel)
└── Jira Board Context ────────┼──→ Jira Fetch (parallel)
                               │
                               ▼
                      Orchestrator Agent
                            │
                            ▼
                         Router
                      /    |    \      ← fan-out via Send()
                     ▼     ▼     ▼
               Story Writer ×N (concurrent)
                     │
                     ▼
                 Validation (rule-based)
                     │
              ┌──────┴──────┐
              ▼             ▼
         (failures)    (all passed)
          Feedback      Assembler
              │             │
              ▼             ▼
         Validation        END
         (retry loop)
```

### Key Metrics
- **Nodes**: 8 total (2 ingestion + 1 orchestrator + 1 routing + 1 writer + 1 validation + 1 feedback + 1 assembler)
- **Fan-out Factor**: N× concurrent via Send() (one story writer per story)
- **Quality Loops**: Up to 3 revision cycles per story (validation → feedback → validation)
- **Token Reduction**: Vector search filters ~3000 → ~800 tokens for LLM calls
- **Sprint Capacity**: Respects Jira velocity with realistic buffer

---

## 🎯 Architecture Decisions

### Why Multi-Agent Pipeline Instead of Single LLM Call?

| Dimension | Single LLM Call | Multi-Agent Pipeline |
|-----------|----------------|---------------------|
| Context Window | PRD (3000+ tokens) + Jira context + format rules = exceeds limits | Each agent focuses on specific context subset |
| Quality Control | Single pass, no validation | Dedicated rule-based validation with LLM feedback loop |
| Failure Handling | All-or-nothing | Partial success, failed stories flagged after max retries |
| Observability | Black box | Per-agent status, token tracking, duration metrics |
| Token Efficiency | Entire context each call | Vector search reduces context by ~60-70% |
| Maintainability | Monolithic prompt | Modular prompts, each independently tunable |

### Why Concurrent Fan-Out?

Sequential processing of 20 stories = 20 × (LLM call + validation) = **slow**
Concurrent fan-out via LangGraph Send() = N parallel workers = **~N× speedup**

```
Sequential: [Story1][Story2][Story3]...[Story20] = 20 units
Concurrent: [Story1][Story5][Story9]...
            [Story2][Story6][Story10]...        = ~7 units
            [Story3][Story7][Story11]...
```

---

## 🔧 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Graph Runtime** | LangGraph (StateGraph + Send()) | Native support for concurrent fan-out, conditional edges, state management |
| **Job Queue** | BullMQ + Redis | Persistent job queue with retries, rate limiting, and observability |
| **LLM** | Qwen3-Next-80B-A3B-Instruct (via Mify API) | Structured JSON output, fast inference, good instruction following |
| **Embeddings** | text-embedding-3-small (OpenAI) | High quality embeddings for PRD chunk retrieval |
| **Vector Store** | In-Memory with LangChain | No external dependency, fast for session-scoped data |
| **Event Streaming** | SSE (Server-Sent Events) | Real-time agent status updates to dashboard |
| **Frontend** | React + TypeScript + Vite | Real-time dashboard with agent pipeline visualization |
| **Database** | MongoDB | Stores generated backlogs for human-in-the-loop review |

---

## 📊 Multi-Agent Pipeline Architecture

### Graph Topology

```
START
  │
  ├──→ PRD Ingestion ──┐
  │                     ├──→ Orchestrator ──→ Router ──→ [Send() per story]
  └──→ Jira Fetch ─────┘                                      │
                                                               ▼
                                                     Story Writer ×N
                                                               │
                                                               ▼
                                                          Validation
                                                               │
                                                    ┌──────────┴──────────┐
                                                    ▼                     ▼
                                              (failures &            (all passed
                                              retries < 2)          or max retries)
                                                    │                     │
                                                    ▼                     ▼
                                                 Feedback            Assembler
                                                    │                     │
                                                    ▼                     ▼
                                                Validation               END
                                              (back to loop)
```

**Key**: The graph has exactly 8 nodes. There is no separate "Context Agent" — business docs are ingested by the PRD Ingestion node alongside the PRD.

### State Schema (Shared Across All Nodes)

```typescript
{
  // ── Input state ──
  raw_prd: string,                    // Raw PRD text (Markdown)
  business_docs: string[],            // Supporting documents
  business_docs_count: number,
  userId: string,
  projectKey: string,
  boardId: string,
  sessionId: string,

  // ── Jira Fetch output ──
  jira_context: {
    velocity: number,                 // Team velocity (story points per sprint)
    team: { developers: number, qa: number, design: number },
    sprint_cadence: number,           // Days per sprint (e.g., 14)
    previous_sprints: [],             // Last 3 closed sprints
    open_bugs: number                 // Count of open bugs in project
  },

  // ── PRD Ingestion output ──
  prd_token_count: number,
  complexity_tier: "small" | "medium" | "large" | "xlarge",

  // ── Orchestrator output ──
  orchestrator_contract: {
    epics: [{
      id: string,
      title: string,
      description: string,
      business_goal: string,
      priority: string,
      stories: [{
        id: string,
        title: string,
        description: string,
        prd_tags: string[],           // Used for vector search in routing
        jira_tags: string[],          // Used for vector search in routing
        sprint: number
      }]
    }],
    total_sprints: number,
    capacity_per_sprint: number
  },

  // ── Routing output ──
  send_list: Send[],                  // Fan-out targets (one per story)

  // ── Story Writer output (per story) ──
  current_batch: Story[],             // Custom reducer: _replace overwrites, array concat appends

  // ── Validation/Feedback accumulated output ──
  written_stories: Story[],           // All validated stories (concat reducer)

  // ── Revision tracking ──
  revision_count: number,             // Total feedback loop iterations (max 3)

  // ── Assembler output ──
  validation_report: {
    total_stories: number,
    passed: number,
    failed_and_flagged: number,
    flagged_story_ids: string[],
    total_sprints: number,
    stories_per_sprint: {}
  },
  backlog_id: string                  // MongoDB document ID
}
```

### State Reducers

LangGraph requires reducers to handle state updates from parallel branches:

| Field | Reducer | Behavior |
|-------|---------|----------|
| `current_batch` | Custom | `_replace` flag overwrites; empty array resets; otherwise concatenates |
| `written_stories` | Concat | Always appends — accumulates stories from all validation cycles |
| `revision_count` | Last-write-wins | Overwrites with latest value |

---

## 🤖 Node Specifications

### 1. PRD Ingestion (`prd_ingestion`)
- **Type**: Pure processing (no LLM)
- **Purpose**: Tokenize PRD + business docs, estimate complexity, create vector store for semantic search
- **Input**: `raw_prd`, `business_docs`, `jira_context`, `userId`
- **Process**:
  1. Combine PRD + business docs text
  2. Estimate token count → derive complexity tier
  3. Create InMemoryVectorStore with all documents (tagged by source: `prd`, `business`, `jira`)
  4. Cache vector store in `vectorStoreCache` map (keyed by userId)
- **Output**: `prd_token_count`, `complexity_tier`, `business_docs_count`
- **Concurrency**: Runs in parallel with Jira Fetch

### 2. Jira Fetch (`jira_fetch`)
- **Type**: Jira API integration (no LLM)
- **Purpose**: Fetch team velocity, sprint history, and open bug count from Jira
- **Input**: `userId`, `projectKey`, `boardId`
- **Process**:
  1. Look up user from MongoDB → get Jira OAuth tokens
  2. Search for open bugs via JQL
  3. Fetch last 3 closed sprints from board (if boardId provided)
- **Output**: `jira_context` object
- **Concurrency**: Runs in parallel with PRD Ingestion
- **Note**: Velocity is currently mocked (returns 20) — needs real calculation from completed story points

### 3. Orchestrator (`orchestrator`)
- **Type**: LLM agent with structured output (pro-tier model)
- **Purpose**: Decompose PRD into epics and story stubs, respecting velocity/capacity constraints
- **Input**: PRD content + Jira context + business docs summary
- **Process**:
  1. For `large`/`xlarge` PRDs: use vector store to retrieve top 40 PRD chunks + top 20 business chunks (reduces token usage)
  2. For `small`/`medium` PRDs: use full text
  3. Invoke pro-tier LLM with `orchestratorPrompt` → structured JSON output via `OrchestratorOutputSchema`
- **Output**: `orchestrator_contract` (epics, stories, sprint plan)
- **Gate**: Waits for both PRD Ingestion and Jira Fetch to complete (LangGraph edge from `["jira_fetch", "prd_ingestion"]`)

### 4. Routing (`routing`)
- **Type**: Pure logic (no LLM)
- **Purpose**: Create a `Send()` per story with relevant vector chunks for context
- **Input**: `orchestrator_contract`, `business_docs`, `jira_context`, `userId`
- **Process**:
  1. For each story in each epic:
     - Similarity search for PRD chunks matching `story.prd_tags` (top 6)
     - Similarity search for Jira chunks matching `story.jira_tags` (top 3)
     - Similarity search for business chunks matching `story.prd_tags + title` (top 4)
  2. Create `Send("story_writer", payload)` with epic context, story stub, and all chunks
- **Output**: `send_list` (array of Send objects), `current_batch: []` (reset)
- **Fan-out**: LangGraph dispatches each Send as an independent parallel branch

### 5. Story Writer (`story_writer`)
- **Type**: LLM agent with structured output (standard model)
- **Purpose**: Generate a complete user story from the stub + context chunks
- **Input** (per Send): `epic_context`, `story_stub`, `prd_chunks`, `jira_chunks`, `biz_chunks`, `business_summary`, `velocity_reference`, `retry_count`, `story_id`
- **Process**:
  1. Queue LLM call via `llmQueue` (rate limiting)
  2. Invoke standard model with `storyWriterPrompt` → structured JSON via `StoryOutputSchema`
  3. On success: mark `validation_status: "passed"` (optimistic)
  4. On failure: create failed story stub with error message
- **Output**: `current_batch` with one story
- **Concurrency**: N instances run in parallel (one per story via Send)
- **Queue**: `llmQueue` prevents API throttling across concurrent workers

### 6. Validation (`validation`)
- **Type**: Rule-based validation (no LLM)
- **Purpose**: Quality gate — check every story against hard rules
- **Validation Rules**:
  - User story must match: `As a [role] I want [feature] so that/so I can [benefit]`
  - Minimum 3 acceptance criteria (no generic phrases: "works correctly", "functions as expected", "system should", "user can complete", "should work", "as expected")
  - Minimum 2 subtasks with descriptions ≥15 characters
  - Description ≥50 characters
- **Process**:
  1. Validate each story in `current_batch`
  2. Stories that pass → add to `written_stories`
  3. Stories that fail + `retry_count < 2` → keep in `current_batch` for feedback
  4. Stories that fail + `retry_count ≥ 2` → flag as failed, add to `written_stories`
- **Output**: `written_stories` (accumulated), `current_batch` (only retryable failures, via `_replace`)
- **Conditional edge**: If `current_batch.length > 0` AND `revision_count < 3` → go to `feedback`; otherwise → `assembler`

### 7. Feedback (`feedback`)
- **Type**: LLM agent with structured output (standard model)
- **Purpose**: Rewrite failed stories with targeted fixes based on failure reasons
- **Input**: `current_batch` (failed stories), `orchestrator_contract` (to look up original story stubs)
- **Process**:
  1. For each failed story:
     - Look up original story stub from orchestrator contract
     - Invoke LLM with `feedbackPrompt` (includes failed output + failure reasons)
     - Mark rewritten story as `validation_status: "passed"`, increment `retry_count`
  2. Small delay (500ms) between stories to prevent rate limiting
- **Output**: `current_batch` (rewritten stories, via `_replace`), `revision_count` (incremented)
- **Loop**: Returns to Validation for re-check

### 8. Assembler (`assembler`)
- **Type**: Pure logic (no LLM)
- **Purpose**: Aggregate results, compute metrics, save to MongoDB
- **Input**: `written_stories`, `orchestrator_contract`, `userId`, `projectKey`, `sessionId`
- **Process**:
  1. Count passed vs failed stories
  2. Build validation report with sprint distribution
  3. Create `GeneratedBacklog` document in MongoDB (status: `pending_review`)
  4. Emit `backlog_ready` SSE event
- **Output**: `validation_report`, `backlog_id`

---

## 🔄 Execution Flow (Step-by-Step)

### 1. Input Collection
```
User uploads PRD (raw text, Markdown, Google Doc) + optional supporting business docs
↓
SSE connection established for real-time status
↓
POST /api/generate
```

### 2. Parallel Ingestion (2 concurrent)
```
PRD Ingestion ──────→ Parse PRD + business docs → Tokenize → Create Vector Store
Jira Fetch ─────────→ Fetch velocity, team, sprint history, open bugs

Both run in parallel, gated by LangGraph before Orchestrator
```

### 3. Orchestration
```
Orchestrator
├── Receives: PRD text + Jira context + business docs
├── For large PRDs: Uses vector search to retrieve relevant chunks (reduces token usage)
├── Creates: Epic/Story decomposition (orchestrator_contract)
├── Respects: Velocity constraints from Jira data
└── Output: orchestrator_contract with epics[], stories[], sprints
```

### 4. Routing (Fan-Out)
```
Router
├── Reads: orchestrator_contract
├── For each story:
│   ├── Retrieves relevant PRD chunks (similarity search, top 6)
│   ├── Retrieves relevant Jira chunks (similarity search, top 3)
│   ├── Retrieves relevant business doc chunks (similarity search, top 4)
│   └── Creates Send("story_writer", { epic_context, story_stub, prd_chunks, jira_chunks, biz_chunks })
└── Output: send_list → LangGraph fans out to N concurrent workers
```

### 5. Story Writing (N concurrent)
```
Story Writer ×N
├── Each receives: epic context + story stub + relevant chunks + velocity reference
├── Uses: storyWriterPrompt → LLM → StoryOutputSchema (structured JSON)
├── Queue: llmQueue ensures rate limiting across concurrent workers
└── Output: current_batch with complete story
```

### 6. Validation + Feedback Loop
```
Validation (rule-based)
├── Checks user_story format ("As a... I want... so that...")
├── Checks acceptance_criteria count (≥3) and quality (no generic phrases)
├── Checks subtasks count (≥2) and description length (≥15 chars)
├── Checks description length (≥50 chars)
│
├── PASS → accumulate in written_stories
├── FAIL + retry_count < 2 → send to Feedback
└── FAIL + retry_count ≥ 2 → flag as failed, move to written_stories

Feedback (LLM)
├── Receives: failed story + failure reasons + original story stub
├── Rewrites: story with targeted fixes
├── Increments: retry_count
└── Returns to Validation for re-check

Guard: revision_count max 3 (prevents infinite loops)
```

### 7. Assembly
```
Assembler
├── Counts: passed vs failed_and_flagged stories
├── Builds: validation_report with sprint distribution
├── Saves: GeneratedBacklog to MongoDB (status: "pending_review")
├── Emits: "backlog_ready" SSE event
└── Output: validation_report, backlog_id
```

---

## 📡 SSE Event Stream

The pipeline emits real-time events via `agentEventBus` (EventEmitter):

```typescript
interface AgentEvent {
  type: "run_start" | "node_start" | "node_end" | "node_context" | "run_end" | "backlog_ready" | "error";
  timestamp: string;
  node?: string;           // e.g., "prd_ingestion", "orchestrator", "story_writer"
  label?: string;          // Human-readable label from NODE_LABELS
  invocation?: number;     // How many times this node has been invoked in this run
  inputs?: {};             // What the node received
  outputs?: {};            // What the node produced
}
```

### Event Types

| Event | When | Payload |
|-------|------|---------|
| `run_start` | Pipeline begins | `runId`, `nodeLabels` map |
| `node_start` | Node begins execution | `node`, `label` |
| `node_context` | Node emits observability data | `inputs`, `outputs`, `invocation` count |
| `node_end` | Node completes | `node`, `label`, optional output summary |
| `backlog_ready` | Assembler saves to MongoDB | `backlog_id`, `sessionId`, `total_stories`, `passed`, `failed` |
| `run_end` | Pipeline completes | `success` boolean, optional `message` |
| `error` | Node fails | `message`, `node` |

---

## 🧠 Vector Store Architecture

### Purpose
Instead of passing entire PRD (3000+ tokens) to every LLM call, use semantic search to retrieve only relevant chunks.

### How It Works

```
PRD Ingestion
├── Combine PRD + business docs + Jira context text
├── Chunk into ~500-token segments
├── Generate embeddings (text-embedding-3-small)
├── Store in InMemoryVectorStore (session-scoped, cached by userId)
└── Each chunk tagged with metadata: { source: "prd" | "business" | "jira" }
```

### Who Uses It

| Node | Query | Filter | Top-K | Purpose |
|------|-------|--------|-------|---------|
| Orchestrator | "product features epics user stories" | `source === "prd"` | 40 | Reduce PRD for large/complex documents |
| Orchestrator | "business rules goals requirements" | `source === "business"` | 20 | Get relevant business context |
| Routing | `story.prd_tags.join(" ")` | `source === "prd"` | 6 | PRD context per story |
| Routing | `story.jira_tags.join(" ")` | `source === "jira"` | 3 | Jira context per story |
| Routing | `story.prd_tags + story.title` | `source === "business"` | 4 | Business context per story |

### Token Reduction
- Full PRD: ~3000 tokens
- Relevant chunks per story: ~800 tokens
- **Reduction: ~70%**

---

## ⚠️ Current Implementation Notes

### LLM Configuration
- **Pro Model** (`proModel`): Used by Orchestrator for planning/decomposition
- **Standard Model** (`model`): Used by Story Writer and Feedback for generation/revision
- Both use `.withStructuredOutput()` with Zod schemas for validated JSON output

### Rate Limiting (BullMQ)
- **LLM Queue** (`llmQueue`): BullMQ queue with concurrency 3, rate limit 10 jobs/60s
  - Job types: `generate-story`, `revise-story`
  - Retries: 3 attempts with exponential backoff (2s → 4s → 8s)
  - Used by: Story Writer, Feedback
- **Push Queue** (`pushQueue`): BullMQ queue with concurrency 1
  - Job type: `push-to-jira`
  - Retries: 3 attempts with exponential backoff (5s → 10s → 20s)
  - Used by: Jira push controller

### Jira Integration
- Uses `jira.js` AgileClient for sprint/board data
- Velocity is currently mocked (returns 20) — needs real calculation from completed story points
- Open bugs fetched via JQL: `project = "{projectKey}" AND issuetype in (Bug) AND statusCategory != Done`

### Concurrency Model
- LangGraph Send() enables N× concurrent story writing (one per story)
- BullMQ workers process LLM and push jobs with configurable concurrency
- Redis-backed persistence: jobs survive server restarts
- Automatic retries with exponential backoff on failure

### Validation is Rule-Based
- The Validation node does **not** use an LLM — it's pure regex/string checks
- Only the Feedback node uses an LLM to rewrite failed stories
- This keeps validation fast, deterministic, and cost-free

---

## 📁 File Structure

```
server/src/
├── config/
│   └── redis.js                # Shared Redis connection for BullMQ
├── backlog-generator/
│   ├── index.js                # Graph definition, compilation, runBacklogGenerator(), SSE event emission
│   ├── state.js                # StateAnnotation with custom reducers for current_batch, written_stories, revision_count
│   ├── agentEventBus.js        # EventEmitter for real-time dashboard updates
│   ├── nodes/
│   │   ├── jiraFetch.js       # Jira API integration (velocity, sprints, bugs)
│   │   ├── prdIngestion.js    # Tokenization, complexity estimation, vector store creation
│   │   ├── orchestrator.js    # Pro-model LLM: PRD → epics + stories
│   │   ├── routing.js         # Fan-out: creates Send() per story with vector chunks
│   │   ├── storyWriter.js     # Standard-model LLM: stub → full story (BullMQ: generate-story)
│   │   ├── validation.js      # Rule-based quality checks (no LLM)
│   │   ├── feedback.js        # Standard-model LLM: rewrite failed stories (BullMQ: revise-story)
│   │   └── assembler.js       # Aggregate results, save to MongoDB
│   ├── prompts/
│   │   ├── orchestrator.prompt.js # Orchestrator system prompt
│   │   ├── storyWriter.prompt.js  # Story writer system prompt
│   │   └── feedback.prompt.js     # Feedback/revision system prompt
│   ├── schemas/
│   │   ├── orchestratorOutput.schema.js  # Zod schema for orchestrator structured output
│   │   └── storyOutput.schema.js         # Zod schema for story writer structured output
│   └── utils/
│       ├── llmQueue.js        # BullMQ LLM queue + worker (replaces old queue.js)
│       ├── vectorStore.js     # InMemoryVectorStore setup + document loading
│       ├── tokenizer.js       # Token estimation + complexity tier classification
│       └── velocityRef.js     # Build velocity reference from Jira context
└── services/
    └── pushWorker.js          # BullMQ Jira push queue + worker
```

---

## 🚀 Quick Start

### Generate a Backlog
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prd": "# Product Requirement Document\n\n## Feature: User Authentication\n...",
    "businessDocs": ["Supporting doc 1..."],
    "userId": "user_id",
    "projectKey": "PROJ",
    "boardId": "123"
  }'
```

### Monitor via SSE
```bash
curl http://localhost:3000/api/agent-status/stream
# Returns real-time agent events as they occur
```

---

## 📚 Related Documentation

- [README.md](../README.md) — Project overview and setup
- [Architecture](./architecture.md) — System architecture diagram
- [API Reference](./api.md) — API endpoints and usage
