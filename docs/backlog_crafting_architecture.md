# Collaborative Backlog Crafting Architecture

This document provides a highly technical deep-dive into the code logic, React state flows, data models, and component architectures that drive the Collaborative Backlog Crafting feature.

## 1. High-Level Data Flow

1. **User Input (`ChatPage.tsx` -> `useChat.ts`)**: User chats with the AI requesting a new feature or Jira ticket.
2. **AI Engine (`chatbot.service.js`)**: Executes the LangGraph agent, using tools to fetch context, and returns a strictly formatted markdown string containing a ```backlog-json``` block.
3. **Frontend Parsing (`MessageBubble.tsx`)**: Intercepts the markdown before rendering, safely parsing the JSON into a strongly-typed `BacklogItem` object.
4. **Hydration (`ChatPage.tsx` & `BacklogCard.tsx`)**: Fetches previously pushed items via `/api/v1/scrum/backlog/history` to ensure previously pushed items are seamlessly restored across page reloads.
5. **Jira Push (`backlogApi.ts` -> `backlog.controller.js`)**: Secure backend proxy that creates the Jira issue and persists the push history in MongoDB.

---

## 2. Component Logic & Code Implementation

### A. Session Hydration at `ChatPage.tsx`
When a user navigates to a specific chat session, we must guarantee that they do not accidentally push the same drafted AI ticket to Jira twice if they refresh the page.

```typescript
// pages/ChatPage.tsx
const [pushedSessionItems, setPushedSessionItems] = useState<PushedBacklogRecord[]>([]);

const loadSessionHistory = useCallback(async () => {
  if (activeSessionId) {
    try {
      const history = await getPushHistory(activeSessionId); // Returns PushedBacklogRecord[]
      setPushedSessionItems(history);
    } catch (err) {
      console.error(err);
    }
  }
}, [activeSessionId, historyRefreshTrigger]);
```
- `historyRefreshTrigger`: An integer incremented whenever a child `<BacklogCard>` fires the `onBacklogPushed` callback, instantly re-fetching the history to ensure global state stays in sync.
- `pushedSessionItems`: Passed down via props: `<ChatMessages />` -> `<MessageBubble />` -> `<BacklogCard />`.

### B. Message Parsing in `MessageBubble.tsx`
The standard `react-markdown` library cannot magically render interactive Javascript state widgets for custom code blocks inline. Therefore, `MessageBubble` implements a pre-parser that slices the raw string.

```typescript
// components/chat/MessageBubble.tsx
// Regex matches: ```backlog-json\n{ ... }\n```
const regex = /```backlog-json\n([\s\S]*?)\n```/g;
let lastIndex = 0;
let match;
const segments = [];

while ((match = regex.exec(content)) !== null) {
  // 1. Push standard markdown text BEFORE the valid JSON block
  if (match.index > lastIndex) {
    segments.push({ type: "text", text: content.slice(lastIndex, match.index) });
  }
  // 2. Safely parse JSON into a BacklogItem
  try {
    const item: BacklogItem = JSON.parse(match[1]);
    segments.push({ type: "backlog-card", item });
  } catch (e) {
    // Fallback if AI corrupted the JSON format
    segments.push({ type: "text", text: match[0] });
  }
  lastIndex = regex.lastIndex;
}
```

### C. The `BacklogCard.tsx` Component
This is the core interactive inline element. It receives the parsed `item: BacklogItem` and the `pushedSessionItems` array array from its parent.

**State Initialization:**
```typescript
const matchingHistoryItem = pushedSessionItems.find(
  (p) => p.summary === initialItem.summary && p.type === initialItem.type
);

// We merge initial AI data with potentially recovered user-edited history
const [item, setItem] = useState<BacklogItem>({ 
  ...initialItem,
  parentKey: matchingHistoryItem?.parentKey || initialItem.parentKey,
  parentSummary: matchingHistoryItem?.parentSummary || initialItem.parentSummary
});

// Immediately override layout if history detected it was pushed previously
const [pushed, setPushed] = useState(!!matchingHistoryItem);
const [pushResult, setPushResult] = useState<{ jiraKey: string; jiraUrl: string } | null>(
  matchingHistoryItem ? { jiraKey: matchingHistoryItem.jiraKey, jiraUrl: matchingHistoryItem.jiraUrl || "" } : null
);
```
- **Edit Mode**: The card allows editing of the `item.summary` and `item.description`. These changes remain in isolated local state (`editState`) until saved.
- **Parent Hierarchy**: The user can search internal Jira backlogs (Epics for Stories, Stories for Tasks) inside the component using the `searchBacklog` API endpoint. Choosing a parent updates the `item.parentKey` state. This prevents orphaned tasks!

### D. MongoDB Persistence (`PushedBacklog.js`)
When `pushBacklogItem` successfully communicates with Jira, the backend writes a permanently auditable record to MongoDB:

```javascript
// models/PushedBacklog.js
const pushedBacklogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String }, // Links to the specific chat thread
  projectKey: { type: String, required: true },
  
  // What the user/AI generated
  summary: { type: String, required: true },
  type: { type: String, required: true },
  parentKey: { type: String },
  parentSummary: { type: String },
  
  // The Atlassian Jira outputs
  jiraKey: { type: String, required: true }, // e.g. "PROJ-142"
  jiraId: { type: String, required: true },
  jiraUrl: { type: String },
  
  pushedAt: { type: Date, default: Date.now }
});
```
This is the exact source of truth fetched by `ChatPage.tsx` and rendered independently inside the `PushHistoryPanel.tsx` sidebar.
