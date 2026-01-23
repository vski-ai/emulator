import React from "react";
import { ChatWindow } from "./ChatWindow.tsx";
import { ChatMessage } from "./ChatBubble.tsx";

interface ChatSimulationLayoutProps {
  userMessages: ChatMessage[];
  managerMessages: ChatMessage[];
  onUserSend: (text: string) => void;
  onManagerSend: (text: string) => void;
  userWaiting?: boolean;
  managerWaiting?: boolean;
}

export function ChatSimulationLayout({
  userMessages,
  managerMessages,
  onUserSend,
  onManagerSend,
  userWaiting,
  managerWaiting,
}: ChatSimulationLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="animate-in slide-in-from-left-4 fade-in duration-500 delay-100">
        <ChatWindow
          title="Storefront Chat (Client)"
          role="user"
          messages={userMessages}
          onSend={onUserSend}
          isWaiting={userWaiting}
        />
      </div>
      <div className="animate-in slide-in-from-right-4 fade-in duration-500 delay-200">
        <ChatWindow
          title="Backoffice Support (Agent)"
          role="manager"
          messages={managerMessages}
          onSend={onManagerSend}
          isWaiting={managerWaiting}
        />
      </div>
    </div>
  );
}
