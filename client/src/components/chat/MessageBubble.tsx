import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, BacklogItem, PushedBacklogRecord } from "../../types/chat.types";
import BacklogCard from "./BacklogCard";

interface MessageBubbleProps {
  message: ChatMessage;
  sessionId?: string | null;
  pushedSessionItems?: PushedBacklogRecord[];
  onBacklogPushed?: (jiraKey: string, jiraUrl: string) => void;
}

/**
 * Parse message content and extract backlog-json code blocks.
 * Returns an array of segments: either { type: 'text', content } or { type: 'backlog', item }.
 */
function parseBacklogBlocks(
  content: string
): Array<
  | { type: "text"; content: string }
  | { type: "backlog"; item: BacklogItem }
> {
  const segments: Array<
    | { type: "text"; content: string }
    | { type: "backlog"; item: BacklogItem }
  > = [];

  // Match ```backlog-json ... ``` blocks
  const regex = /```backlog-json\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before this block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        segments.push({ type: "text", content: textBefore });
      }
    }

    // Parse the JSON block
    try {
      const jsonStr = match[1].trim();
      const item = JSON.parse(jsonStr) as BacklogItem;
      // Validate minimum required fields
      if (item.type && item.summary) {
        segments.push({ type: "backlog", item });
      } else {
        // If it doesn't have required fields, show as text
        segments.push({ type: "text", content: match[0] });
      }
    } catch {
      // On parse failure, show as regular code block
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) {
      segments.push({ type: "text", content: remaining });
    }
  }

  // If no segments were found (no backlog blocks), return the whole content as text
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: "text", content: content.trim() });
  }

  return segments;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sessionId,
  pushedSessionItems,
  onBacklogPushed,
}) => {
  const isUser = message.role === "user";

  const segments = useMemo(
    () => (isUser ? null : parseBacklogBlocks(message.content)),
    [message.content, isUser]
  );

  // User messages: simple bubble
  if (isUser) {
    return (
      <div className="flex w-full mb-4 justify-end">
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-blue-600 text-white rounded-br-none">
          <div className="prose prose-invert max-w-none text-base wrap-break-word prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Assistant messages: render with potential backlog cards
  const hasBacklogItems =
    segments && segments.some((s) => s.type === "backlog");

  return (
    <div className="flex w-full mb-4 justify-start">
      <div
        className={`${
          hasBacklogItems ? "max-w-[85%]" : "max-w-[70%]"
        } px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none`}
      >
        {segments?.map((segment, i) => {
          if (segment.type === "backlog") {
            return (
              <BacklogCard
                key={i}
                item={segment.item}
                sessionId={sessionId}
                pushedSessionItems={pushedSessionItems}
                onPushed={onBacklogPushed}
              />
            );
          }
          return (
            <div
              key={i}
              className={`prose max-w-none text-base wrap-break-word
                prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:shadow-lg prose-pre:rounded-lg
                prose-code:before:content-none prose-code:after:content-none`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline =
                      !match && !String(children).includes("\n");
                    return isInline ? (
                      <code
                        className={`${className} bg-gray-200 text-red-500 px-1.5 py-0.5 rounded text-sm font-mono`}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {segment.content}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageBubble;
