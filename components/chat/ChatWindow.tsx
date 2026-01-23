import React, { useEffect, useRef, useState } from "react";
import { Menu, Send } from "lucide-react";
import { ChatBubble, ChatMessage } from "./ChatBubble.tsx";

interface ChatWindowProps {
  title: string;
  role: "user" | "manager";
  messages: ChatMessage[];
  onSend?: (text: string) => void;
  isWaiting?: boolean;
}

export function ChatWindow(
  { title, role, messages, onSend, isWaiting }: ChatWindowProps,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // If user is within 100px of the bottom, enable auto-scroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSend?.(input);
    setInput("");
  };

  return (
    <div
      className={`card bg-base-100 border shadow-xl h-[600px] flex flex-col overflow-hidden transition-all duration-500 ${
        isWaiting
          ? "border-primary shadow-2xl shadow-primary/20 ring-1 ring-primary/20 scale-[1.01]"
          : "border-base-content/10"
      }`}
    >
      {/* Header */}
      <div className="bg-base-200/50 p-4 border-b border-base-content/5 flex items-center gap-3 backdrop-blur-md">
        <div
          className={`w-3 h-3 rounded-full ${
            role === "user" ? "bg-accent" : "bg-primary"
          }`}
        >
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-[10px] opacity-40 font-mono">
            {role === "user" ? "Connected as Guest" : "Connected as Admin"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-base-100 to-base-200/30"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-base-content/10 animate-pulse">
            </div>
            <p className="text-xs uppercase font-bold tracking-widest">
              No messages
            </p>
          </div>
        )}
        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
      </div>

      {/* Input */}
      <div className="p-3 bg-base-100 border-t border-base-content/5">
        <form onSubmit={handleSend} className="join w-full shadow-sm">
          <button type="button" className="btn btn-square join-item btn-sm">
            <Menu size={16} />
          </button>
          <input
            type="text"
            className="input input-bordered input-sm join-item flex-1 font-mono text-xs focus:outline-none"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled
          />
          <button
            type="submit"
            className="btn btn-square join-item btn-sm btn-neutral"
          >
            <Send size={14} />
          </button>
        </form>
        <div className="text-[9px] text-center mt-2 opacity-30 font-bold uppercase tracking-widest">
          Secure connection • End-to-end encrypted
        </div>
      </div>
    </div>
  );
}
