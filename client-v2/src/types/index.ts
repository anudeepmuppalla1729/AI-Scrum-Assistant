// Auth
export interface User {
  userId: string;
  email: string;
}

// Jira
export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location?: {
    projectId: number;
    displayName: string;
    projectKey: string;
  };
}

export interface JiraSprint {
  id: number;
  state: "active" | "closed" | "future";
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    issuetype: { name: string; iconUrl?: string };
    assignee?: { displayName: string; avatarUrls?: Record<string, string> };
    priority?: { name: string; iconUrl?: string };
    storyPoints?: number;
    customfield_10016?: number; // story points field
    parent?: { key: string; fields: { summary: string } };
  };
}

// Chat
export interface ChatSession {
  _id: string;
  title: string;
  boardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// PRD / Backlog Generation
export interface PRDSession {
  _id: string;
  title: string;
  prompt?: string;
  status: "idle" | "processing" | "ready" | "failed";
  generatedBacklogId?: string;
  error?: string;
  epics?: RawEpic[];
  options: PRDOptions;
  createdAt: string;
  updatedAt: string;
}

export interface PRDOptions {
  includeAcceptanceCriteria: boolean;
  estimateStoryPoints: boolean;
  includeSubTasks: boolean;
}

// Raw API format (what the server actually stores in PRDSession.epics)
export interface RawEpic {
  id: string;
  title: string;
  description?: string;
  issues: RawIssue[];
}

export interface RawIssue {
  type: string;
  summary: string;
  description: string;
  acceptance_criteria: string[];
  priority: string;
  story_points: number;
  sub_issues: RawSubIssue[];
}

export interface RawSubIssue {
  type: string;
  summary: string;
  description: string;
}

// Normalized format (used after transform)
export interface Epic {
  epic_id: string;
  epic_title: string;
  epic_description?: string;
  stories: Story[];
}

export interface Story {
  story_id: string;
  epic_id: string;
  user_story: string;
  description: string;
  acceptance_criteria: string[];
  priority: "High" | "Medium" | "Low";
  story_points: number;
  sprint?: string;
  subtasks: Subtask[];
  validation_status?: "pass" | "fail";
  failure_reasons?: string[];
  retry_count?: number;
}

export interface Subtask {
  task_id: string;
  task_title: string;
  task_description?: string;
}

// Transform raw API epics to normalized format
export function normalizeEpics(raw: RawEpic[]): Epic[] {
  return raw.map((epic) => ({
    epic_id: epic.id,
    epic_title: epic.title,
    epic_description: epic.description,
    stories: (epic.issues ?? []).map((issue, si) => ({
      story_id: `${epic.id}-story-${si}`,
      epic_id: epic.id,
      user_story: issue.summary,
      description: issue.description,
      acceptance_criteria: issue.acceptance_criteria ?? [],
      priority: normalizePriority(issue.priority),
      story_points: issue.story_points ?? 0,
      subtasks: (issue.sub_issues ?? []).map((sub, ti) => ({
        task_id: `${epic.id}-story-${si}-task-${ti}`,
        task_title: sub.summary,
        task_description: sub.description,
      })),
    })),
  }));
}

function normalizePriority(p: string): "High" | "Medium" | "Low" {
  const up = (p ?? "").toUpperCase();
  if (up === "HIGH" || up === "P1") return "High";
  if (up === "LOW" || up === "P3") return "Low";
  return "Medium";
}

// Generated Backlog (from DB)
export interface GeneratedBacklog {
  _id: string;
  userId: string;
  sessionId: string;
  projectKey: string;
  status: "pending_review" | "partially_pushed" | "fully_pushed" | "rejected";
  orchestrator_contract?: {
    epics: Array<{
      epic_id: string;
      epic_title: string;
      epic_description?: string;
      stories: Array<{
        story_id: string;
        user_story: string;
        sprint?: string;
      }>;
    }>;
  };
  stories: Story[];
  epic_statuses: EpicStatus[];
  validation_report?: {
    total: number;
    passed: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EpicStatus {
  epic_id: string;
  status:
    | "pending_review"
    | "approved"
    | "pushing"
    | "pushed"
    | "failed"
    | "rejected";
  jira_push_result?: {
    success: boolean;
    jiraKey?: string;
    jiraUrl?: string;
    error?: string;
  };
  pushed_at?: string;
}

// Business Documents
export interface BusinessDocument {
  _id: string;
  filename: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  boardId?: string;
  createdAt: string;
}

// Push History
export interface PushedBacklog {
  _id: string;
  sessionId?: string;
  projectKey: string;
  jiraKey: string;
  jiraId: string;
  type: string;
  summary: string;
  description?: string;
  storyPoints?: number;
  priority?: string;
  parentKey?: string;
  parentSummary?: string;
  jiraUrl: string;
  createdAt: string;
}

// SSE Events
export interface AgentEvent {
  type:
    | "connected"
    | "heartbeat"
    | "run_start"
    | "run_end"
    | "node_start"
    | "node_end"
    | "node_context"
    | "backlog_ready"
    | "error";
  timestamp: string;
  node?: string;
  runId?: string;
  nodeLabels?: Record<string, string>;
  message?: string;
}
