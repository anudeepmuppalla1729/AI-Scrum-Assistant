import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <div
          className={`prose ${
            isUser ? "prose-invert" : ""
          } max-w-none text-base wrap-break-word
          prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:shadow-lg prose-pre:rounded-lg
          prose-code:before:content-none prose-code:after:content-none`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !String(children).includes("\n");
                return isInline ? (
                  <code
                    className={`${className} ${
                      isUser
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-red-500"
                    } px-1.5 py-0.5 rounded text-sm font-mono`}
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
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
