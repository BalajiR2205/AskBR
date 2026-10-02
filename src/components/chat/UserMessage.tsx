'use client';

import React from 'react';
import { ChatMessage } from './types';

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="user-message-row" aria-label="Your question">
      <div className="user-message-card">
        <span className="user-message-prefix" aria-hidden="true">Question</span>
        <p className="user-message-text">{message.content}</p>
      </div>
    </div>
  );
}
