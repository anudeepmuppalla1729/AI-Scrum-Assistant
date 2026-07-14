import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChat } from "../hooks/useChat";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import {
  Plus,
  Send,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BacklogCard } from "../components/chat/BacklogCard";
import "./ChatPage.css";

// Parse ```backlog-json ... ``` blocks from message content
function parseBacklogBlocks(content: string): Array<
  | { type: "text"; content: string }
  | { type: "backlog"; item: { type: string; summary: string; description?: string; acceptanceCriteria?: string[]; priority?: string; storyPoints?: number; parentKey?: string } }
> {
  const segments: Array<
    | { type: "text"; content: string }
    | { type: "backlog"; item: { type: string; summary: string; description?: string; acceptanceCriteria?: string[]; priority?: string; storyPoints?: number; parentKey?: string } }
  > = [];

  const regex = /```backlog-json\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) segments.push({ type: "text", content: textBefore });
    }

    try {
      const jsonStr = match[1]?.trim() ?? "";
      const item = JSON.parse(jsonStr);
      if (item.type && item.summary) {
        segments.push({ type: "backlog", item });
      } else {
        segments.push({ type: "text", content: match[0] });
      }
    } catch {
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) segments.push({ type: "text", content: remaining });
  }

  if (segments.length === 0 && content.trim()) {
    segments.push({ type: "text", content: content.trim() });
  }

  return segments;
}

export function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const {
    sessions,
    activeSessionId,
    isLoading: isLoadingSessions,
    loadSessions,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
  } = useChatStore();

  const currentSessionId = sessionId ?? activeSessionId;
  const { messages, isLoading: isLoadingMessages, isSending, sendMessage } = useChat(currentSessionId ?? null);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions(workspace?.boardId?.toString());
  }, [loadSessions, workspace]);

  useEffect(() => {
    if (sessionId) {
      setActiveSession(sessionId);
    }
  }, [sessionId, setActiveSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    const session = await createSession(workspace?.boardId?.toString());
    navigate(`/chat/${session._id}`);
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(id);
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s._id !== id);
      navigate(remaining[0] ? `/chat/${remaining[0]._id}` : "/chat");
    }
  };

  const handleStartRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveRename = async () => {
    if (editingId && editTitle.trim()) {
      await renameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <PageContainer className="chat-page-container">
      <div className="chat-layout">
        {/* Session Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3>Conversations</h3>
            <Button size="sm" variant="ghost" icon={<Plus size={16} />} onClick={handleNewChat}>
              New
            </Button>
          </div>

          {isLoadingSessions && <Spinner />}

          <div className="chat-sidebar-list">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`chat-sidebar-item ${currentSessionId === session._id ? "active" : ""}`}
                onClick={() => handleSelectSession(session._id)}
              >
                {editingId === session._id ? (
                  <div className="chat-sidebar-edit">
                    <input
                      className="chat-sidebar-edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
                      autoFocus
                    />
                    <button onClick={handleSaveRename}><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="chat-sidebar-item-title">{session.title}</span>
                    <div className="chat-sidebar-item-actions">
                      <button onClick={(e) => handleStartRename(session._id, session.title, e)}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => handleDeleteSession(session._id, e)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          <div className="chat-header">
            <h3>
              {sessions.find((s) => s._id === currentSessionId)?.title ?? "New Conversation"}
            </h3>
            {workspace && (
              <span className="chat-header-workspace">{workspace.boardName}</span>
            )}
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {isLoadingMessages && (
              <div className="chat-messages-loading">
                <Spinner />
              </div>
            )}

            {!isLoadingMessages && messages.length === 0 && (
              <EmptyState
                icon={<MessageSquare size={48} />}
                title="Start a conversation"
                description="Ask about your sprints, backlogs, or get Scrum advice."
              />
            )}

            {messages.map((msg) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div key={msg._id} className="chat-bubble chat-bubble-user">
                    <div className="chat-bubble-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              }

              // Assistant message: parse backlog-json blocks
              const segments = parseBacklogBlocks(msg.content);
              const hasBacklog = segments.some((s) => s.type === "backlog");

              return (
                <div key={msg._id} className={`chat-bubble chat-bubble-assistant ${hasBacklog ? "chat-bubble-wide" : ""}`}>
                  <div className="chat-bubble-content">
                    {segments.map((seg, i) => {
                      if (seg.type === "backlog") {
                        return (
                          <div key={i} className="chat-backlog-card-wrapper">
                            <BacklogCard item={seg.item} sessionId={currentSessionId} />
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="chat-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {seg.content}
                          </ReactMarkdown>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="chat-bubble chat-bubble-assistant">
                <div className="chat-bubble-content">
                  <div className="chat-thinking">
                    <span className="chat-thinking-dot" />
                    <span className="chat-thinking-dot" />
                    <span className="chat-thinking-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Ask about your sprints, backlogs, or get Scrum advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <Button
              size="sm"
              icon={<Send size={16} />}
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              loading={isSending}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
