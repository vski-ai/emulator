import React from "react";
import { Cpu, Shield, User } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "manager" | "system";
  text: string;
  timestamp: Date;
  actions?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
  }[];
  isTyping?: boolean;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isMe = message.sender === "user" || message.sender === "manager";
  // Wait, in "User Chat", "user" is ME. In "Backoffice Chat", "manager" is ME.
  // Actually, let's pass a prop `isMe` from parent depending on which window we are in.
  // But for now let's stick to a generic "left/right" based on role isn't enough because we have two separate chats.
  // Let's assume the "System" is always on the left (received), and the "Actor" is on the right (sent).

  return (
    <div
      className={`chat ${
        message.sender === "system" ? "chat-start" : "chat-end"
      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div className="chat-image avatar placeholder">
        <div
          className={`w-8 h-8 rounded-full ${
            message.sender === "system"
              ? "bg-base-300 text-base-content/50"
              : "bg-primary text-primary-content"
          } flex items-center justify-center`}
        >
          {message.sender === "system" && <Cpu size={14} />}
          {message.sender === "user" && <User size={14} />}
          {message.sender === "manager" && <Shield size={14} />}
        </div>
      </div>
      <div className="chat-header text-[10px] opacity-50 mb-1 uppercase tracking-widest font-bold">
        {message.sender}
        <time className="text-[9px] ml-2 font-mono font-normal normal-case opacity-70">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </time>
      </div>
      <div
        className={`chat-bubble text-sm shadow-sm ${
          message.sender === "system"
            ? "chat-bubble-base-200 text-base-content"
            : "chat-bubble-primary"
        }`}
      >
        {message.text.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < message.text.split("\n").length - 1 && <br />}
          </React.Fragment>
        ))}
        {message.isTyping && (
          <span className="loading loading-dots loading-xs ml-1"></span>
        )}
      </div>

      {message.actions && message.actions.length > 0 && (
        <div className="chat-footer opacity-100 mt-2 flex flex-wrap gap-2 justify-end max-w-[80%]">
          {message.actions.map((action, i) => (
            <button
              key={i}
              className={`btn btn-xs shadow-sm ${
                action.primary ? "btn-primary" : "btn-neutral"
              } ${
                action.disabled
                  ? "btn-disabled opacity-50"
                  : "animate-smooth-blink"
              }`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
