import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { BookOpen, Code2, ArrowRight, Menu, Sparkles, X, Lock, Lightbulb, Info } from "lucide-react";
import "./DocsPage.css";

type Tab = "user" | "technical";

const USER_SECTIONS = [
  { id: "getting-started", title: "Getting Started" },
  { id: "backlog-generation", title: "Backlog Generation" },
  { id: "reviewing-backlogs", title: "Reviewing Backlogs" },
  { id: "jira-integration", title: "Jira Integration" },
  { id: "chat-assistant", title: "Chat with Parallel Assistant" },
  { id: "context-documents", title: "Context & Documents" },
  { id: "reports", title: "Reports & Retrospectives" },
];

const TECH_SECTIONS = [
  { id: "architecture", title: "Architecture" },
  { id: "pipeline", title: "LangGraph Pipeline" },
  { id: "embedding", title: "Embedding Service" },
  { id: "rag", title: "RAG System" },
  { id: "api", title: "API Reference" },
  { id: "deployment", title: "Deployment" },
];

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("user");
  const [activeSection, setActiveSection] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = activeTab === "user" ? USER_SECTIONS : TECH_SECTIONS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    const content = contentRef.current;
    if (content) {
      content.querySelectorAll(".docs-section").forEach((el) => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    setActiveSection(sections[0]?.id || "");
    setSidebarOpen(false);
  }, [activeTab]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="docs">
      <button className="docs-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {sidebarOpen && <div className="docs-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`docs-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="docs-sidebar-header">
          <h2 className="docs-sidebar-title">Documentation</h2>
        </div>

        <div className="docs-sidebar-tabs">
          <button
            className={`docs-sidebar-tab ${activeTab === "user" ? "active" : ""}`}
            onClick={() => setActiveTab("user")}
          >
            <BookOpen size={14} />
            User Guide
          </button>
          <button
            className={`docs-sidebar-tab ${activeTab === "technical" ? "active" : ""}`}
            onClick={() => setActiveTab("technical")}
          >
            <Code2 size={14} />
            Platform notes
          </button>
        </div>

        <nav className="docs-sidebar-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`docs-sidebar-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="docs-main" ref={contentRef}>
        <div className="docs-content">
          <header className="docs-hero">
            <span className="docs-hero-eyebrow"><Sparkles size={14} /> Parallel Agile Assistant guide</span>
            <h1>{activeTab === "user" ? "From PRD to Jira in minutes." : "The platform behind better planning."}</h1>
            <p>{activeTab === "user" ? "Learn how to generate backlogs, connect Jira, chat with the assistant, and get sprint reports — all in one place." : "A concise reference for the services and integrations that power Parallel Agile Assistant."}</p>
          </header>
          {activeTab === "user" ? <UserGuide /> : <TechnicalDocs />}

          <div className="docs-cta">
            <Button onClick={() => navigate("/prd")}>
              Try Backlog Generator
              <ArrowRight size={16} />
            </Button>
            {!isAuthenticated && (
              <Button variant="secondary" onClick={() => navigate("/login")}>
                Login for Full Access
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── User Guide ──────────────────────────────────── */

function UserGuide() {
  return (
    <div className="docs-guide">
      <DocSection id="getting-started" title="Getting Started">
        <p>
          Parallel Agile Assistant automates backlog creation from your product requirements. Upload a PRD or paste your requirements, and the assistant generates a complete backlog with epics, user stories, acceptance criteria, priorities, and story point estimates.
        </p>
        <Callout type="tip" icon={<Lightbulb size={16} />}>
          <strong>No account needed to generate backlogs</strong>
          You can generate your first backlog without signing up. Connect your Atlassian account when you want to push approved work to Jira, use the chat assistant, or access sprint reports.
        </Callout>
      </DocSection>

      <DocSection id="backlog-generation" title="Automated Backlog Generation">
        <p>
          Upload a PRD (PDF or plain text) and Parallel Agile Assistant will generate a structured backlog containing:
        </p>
        <ul>
          <li><strong>Epics</strong> — high-level features grouped by theme</li>
          <li><strong>User Stories</strong> — detailed stories with clear descriptions</li>
          <li><strong>Acceptance Criteria</strong> — testable criteria for each story</li>
          <li><strong>Priority Levels</strong> — Highest, High, Medium, Low, or Lowest for each item</li>
          <li><strong>Story Point Estimates</strong> — effort estimates based on complexity</li>
          <li><strong>Subtasks</strong> — implementation tasks broken down from each story</li>
        </ul>
        <h4>Supported input formats</h4>
        <ul>
          <li><strong>PDF files</strong> — upload a product brief, PRD, or spec document</li>
          <li><strong>Plain text</strong> — paste notes, meeting summaries, or requirement descriptions</li>
        </ul>
        <Callout type="tip" icon={<Lightbulb size={16} />}>
          <strong>Tips for better results</strong>
          Be specific about the customer problem and desired outcome. Mention constraints, edge cases, and non-functional requirements. The more context you provide, the better the generated backlog will be.
        </Callout>
      </DocSection>

      <DocSection id="reviewing-backlogs" title="Reviewing Generated Backlogs">
        <p>
          After generation, your backlog is presented in a structured review view grouped by epics. Each story shows its description, acceptance criteria, priority, and story point estimate.
        </p>
        <h4>What you can do in review</h4>
        <ul>
          <li>Browse the full backlog at epic or story level</li>
          <li>Check acceptance criteria and story point estimates</li>
          <li>Verify priorities are assigned correctly</li>
          <li>Select which items to approve and push to Jira</li>
        </ul>
      </DocSection>

      <DocSection id="jira-integration" title="Direct Jira Integration">
        <Callout type="auth" icon={<Lock size={16} />}>
          <strong>Login required</strong>
          Connect your Atlassian account to push backlogs to Jira.
        </Callout>
        <p>
          Once you approve a generated backlog, push it directly to your Jira board. The structure maps exactly:
        </p>
        <ul>
          <li><strong>Epics</strong> → Jira Epics</li>
          <li><strong>Stories</strong> → Jira Stories (linked to parent Epic)</li>
          <li><strong>Subtasks</strong> → Jira Tasks (linked to parent Story)</li>
        </ul>
        <p>
          Priorities, descriptions, acceptance criteria, and story points are all carried over. You choose which items to push — nothing reaches Jira without your explicit approval.
        </p>
        <Callout type="info" icon={<Info size={16} />}>
          Select a Jira board after login to set your workspace. All pushes and context retrieval are scoped to that board.
        </Callout>
      </DocSection>

      <DocSection id="chat-assistant" title="Chat with Parallel Assistant">
        <Callout type="auth" icon={<Lock size={16} />}>
          <strong>Login required</strong>
          Connect your Atlassian account to use the chat assistant.
        </Callout>
        <p>
          The Parallel Assistant is a context-aware AI chat that understands your project. It pulls context from your uploaded business documents, Jira tickets, sprint data, and board history. Use it to:
        </p>
        <ul>
          <li><strong>Brainstorm backlogs</strong> — describe what you want to build and get individual stories with acceptance criteria and estimates on the fly</li>
          <li><strong>Craft stories on the go</strong> — ask for a specific user story or sub-task and the assistant generates it with full detail</li>
          <li><strong>Ask about your sprint</strong> — query ticket status, blockers, velocity, and progress</li>
          <li><strong>Plan and prioritise</strong> — discuss trade-offs and get data-backed suggestions based on your team's capacity and sprint history</li>
          <li><strong>Refine requirements</strong> — get help improving acceptance criteria, splitting stories, or estimating effort</li>
        </ul>
        <Callout type="tip" icon={<Lightbulb size={16} />}>
          <strong>Context matters</strong>
          The more documents you upload and the more Jira data available, the more relevant and accurate the assistant's suggestions will be.
        </Callout>
      </DocSection>

      <DocSection id="context-documents" title="Context & Documents">
        <Callout type="auth" icon={<Lock size={16} />}>
          <strong>Login required</strong>
          Connect your Atlassian account to manage documents.
        </Callout>
        <p>
          Upload business documents, technical specs, research notes, or customer insights to give the assistant proper context about your product. These documents are:
        </p>
        <ul>
          <li><strong>Embedded and indexed</strong> — chunked and stored as vector embeddings for semantic search</li>
          <li><strong>Used during backlog generation</strong> — the PRD pipeline retrieves relevant context from your documents</li>
          <li><strong>Available in chat</strong> — the assistant can reference your docs when answering questions or crafting stories</li>
          <li><strong>Scoped to your board</strong> — documents are tied to your selected Jira workspace</li>
        </ul>
      </DocSection>

      <DocSection id="reports" title="Reports & Retrospectives">
        <Callout type="auth" icon={<Lock size={16} />}>
          <strong>Login required</strong>
          Connect your Atlassian account to access reports.
        </Callout>
        <p>
          Get automated reports generated from your Jira board data and sprint history:
        </p>
        <ul>
          <li><strong>Daily standup reports</strong> — see what was completed yesterday, what's in progress today, and where blockers exist</li>
          <li><strong>Weekly progress reports</strong> — track story completion rates, velocity trends, and team capacity over the week</li>
          <li><strong>Sprint retrospective reports</strong> — review sprint goals vs. actuals, identify patterns, and surface insights for the next planning session</li>
        </ul>
        <p>
          Reports are generated by the chat assistant using live data from your Jira board. Ask for a report in the chat, and it will pull the latest ticket statuses, transitions, and metrics.
        </p>
      </DocSection>
    </div>
  );
}

/* ── Technical Docs ──────────────────────────────── */

function TechnicalDocs() {
  return (
    <div className="docs-technical">
      <DocSection id="architecture" title="Architecture Overview">
        <p>Parallel Agile Assistant is a microservices-based application:</p>
        <ul>
          <li><strong>Node.js/Express Server</strong> — API layer, LangGraph agent orchestration, Jira integration</li>
          <li><strong>Python Embedding Service</strong> — FastAPI + sentence-transformers for text embeddings</li>
          <li><strong>ChromaDB</strong> — Vector database for RAG-powered context retrieval</li>
          <li><strong>Redis</strong> — Job queue (BullMQ) for async push operations</li>
          <li><strong>MongoDB Atlas</strong> — Persistent storage for sessions, backlogs, and user data</li>
          <li><strong>React + Vite</strong> — Client-side SPA with TypeScript</li>
        </ul>
      </DocSection>

      <DocSection id="pipeline" title="LangGraph Agent Pipeline">
        <p>Backlog generation uses an 8-node LangGraph StateGraph:</p>
        <pre className="docs-code">{`START → [jira_fetch, prd_ingestion] (parallel)
  → orchestrator
  → routing (fans out via Send())
  → story_writer (parallel per batch)
  → validation (retry up to 3x via feedback)
  → assembler
  → END`}</pre>
        <h4>Node details</h4>
        <ul>
          <li><strong>jira_fetch</strong> — Fetches Jira context (open bugs, sprint velocity, team composition). Returns dummy data for anonymous users.</li>
          <li><strong>prd_ingestion</strong> — Parses PRD text, chunks documents, creates in-memory vector store</li>
          <li><strong>orchestrator</strong> — Analyzes PRD and generates epic/story contract using LLM</li>
          <li><strong>routing</strong> — Splits stories into batches for parallel writing</li>
          <li><strong>story_writer</strong> — Generates detailed user stories with acceptance criteria</li>
          <li><strong>validation</strong> — Validates stories against contract, triggers feedback loop if needed</li>
          <li><strong>assembler</strong> — Saves final backlog to MongoDB</li>
        </ul>
      </DocSection>

      <DocSection id="embedding" title="Embedding Service">
        <p>
          A standalone Python FastAPI service using <code>sentence-transformers</code> with the{" "}
          <code>all-MiniLM-L6-v2</code> model (384-dimensional embeddings).
        </p>
        <h4>Endpoints</h4>
        <ul>
          <li><code>POST /embed</code> — Batch embedding (array of texts)</li>
          <li><code>POST /embed-query</code> — Single query embedding</li>
          <li><code>GET /health</code> — Service health check</li>
        </ul>
        <h4>Design decisions</h4>
        <ul>
          <li>Model loads in background thread (non-blocking startup for Railway healthchecks)</li>
          <li>Pre-downloaded at Docker build time for fast cold starts</li>
          <li>~300MB RAM footprint (fits Railway free tier)</li>
        </ul>
      </DocSection>

      <DocSection id="rag" title="RAG System">
        <p>
          ChromaDB stores embeddings for Jira tickets, sprints, PRDs, and business documents.
          Collections are organized per Jira board: <code>scrum_kb_board_v3_{'<boardId>'}</code>
        </p>
        <h4>Chunking strategy</h4>
        <ul>
          <li>PRD documents: 1000-char chunks, 200-char overlap</li>
          <li>Business documents: 1000-char chunks, 200-char overlap</li>
          <li>In-memory vector store (for LangGraph): 512-char chunks, 50-char overlap</li>
        </ul>
        <h4>Query flow</h4>
        <p>
          User query → embed via embedding service → ChromaDB similarity search → context injected into LLM prompt.
          Tries board-specific collection first, falls back to legacy shared collection.
        </p>
      </DocSection>

      <DocSection id="api" title="API Reference">
        <h4>Authentication</h4>
        <ul>
          <li><code>POST /auth/jira/login</code> — Initiate Atlassian OAuth flow</li>
          <li><code>GET /auth/jira/callback</code> — OAuth callback, issues JWT</li>
        </ul>
        <h4>PRD Sessions (public)</h4>
        <ul>
          <li><code>POST /api/v1/prd/session</code> — Create session</li>
          <li><code>GET /api/v1/prd/sessions</code> — List sessions</li>
          <li><code>GET /api/v1/prd/session/:id</code> — Get session</li>
        </ul>
        <h4>Backlog Generation (public)</h4>
        <ul>
          <li><code>POST /api/v1/backlog/suggestions</code> — Generate from PRD (multipart)</li>
        </ul>
        <h4>Jira Push (auth required)</h4>
        <ul>
          <li><code>POST /api/v1/backlog/pushToJira</code> — Push suggestions to Jira</li>
          <li><code>POST /api/v1/backlog/generated/:id/approve</code> — Approve and push</li>
        </ul>
        <h4>Chat (auth required)</h4>
        <ul>
          <li><code>POST /api/v1/chat/:sessionId</code> — Send message</li>
          <li><code>GET /api/v1/chat/sessions</code> — List chat sessions</li>
        </ul>
      </DocSection>

      <DocSection id="deployment" title="Deployment">
        <h4>Environment variables</h4>
        <pre className="docs-code">{`# Server
PORT=2000
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
CHROMA_URL=https://chroma-xxx.up.railway.app
EMBEDDING_SERVICE_URL=https://embedding-xxx.up.railway.app
JWT_SECRET=your-secret

# Atlassian OAuth
ATLASSIAN_CLIENT_ID=...
ATLASSIAN_CLIENT_SECRET=...

# LLM Keys (at least one)
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=...
GROQ_API_KEY=...

# Client
VITE_API_URL=https://your-server-url.com`}</pre>
        <h4>Docker Compose</h4>
        <p>
          Local development uses Docker Compose with Redis, ChromaDB, embedding service, and the Node server.
          Production deploys each service independently (Railway, VPS, etc.).
        </p>
      </DocSection>
    </div>
  );
}

/* ── Shared Components ───────────────────────────── */

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="docs-section">
      <h3 className="docs-section-title">{title}</h3>
      <div className="docs-section-body">{children}</div>
    </section>
  );
}

function Callout({ type, icon, children }: { type: "info" | "auth" | "tip"; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`docs-callout docs-callout-${type}`}>
      <span className="docs-callout-icon">{icon}</span>
      <div className="docs-callout-body">{children}</div>
    </div>
  );
}
