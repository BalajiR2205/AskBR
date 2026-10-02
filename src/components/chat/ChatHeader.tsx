'use client';

import React from 'react';
import Link from 'next/link';

interface ChatHeaderProps {
  onNewChat: () => void;
  hasMessages: boolean;
}

export function ChatHeader({ onNewChat, hasMessages }: ChatHeaderProps) {
  return (
    <header className="chat-app-header" aria-label="Chat header">
      <div className="chat-header-brand">
        <Link href="/" className="chat-header-brand-link" title="Return to Overview">
          <div className="chat-header-logo" aria-hidden="true">
            अ
          </div>
          <div className="chat-header-titles">
            <span className="chat-header-title">Ask Ambedkar</span>
            <span className="chat-header-subtitle">Primary Source Research</span>
          </div>
        </Link>
      </div>

      <div className="chat-header-actions">
        <Link href="/" className="chat-nav-link" title="Go to Overview / Segment 0 Landing">
          Overview
        </Link>

        <button
          type="button"
          id="new-chat-btn"
          className="new-chat-btn"
          onClick={onNewChat}
          disabled={!hasMessages}
          title={hasMessages ? "Start a new conversation" : "No conversation active"}
          aria-label="Start a new conversation"
        >
          <span className="new-chat-icon" aria-hidden="true">＋</span>
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}
