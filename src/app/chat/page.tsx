import type { Metadata } from 'next';
import { ChatPage } from '@/components/chat/ChatPage';

export const metadata: Metadata = {
  title: 'Chat — Ask Ambedkar',
  description:
    'Ask questions about Dr. B. R. Ambedkar’s documented writings, speeches, and debates. Explore primary sources and verbatim evidence.',
};

export default function ChatRoute() {
  return <ChatPage />;
}
