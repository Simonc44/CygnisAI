
'use client';
import { useEffect } from 'react';
import { ChatView } from '@/components/chat/chat-view';
import { useApp } from '@/components/app-provider';
import { useAuth } from '@/services/auth-service.tsx';
import { usePathname } from 'next/navigation';

export default function ChatPage() {
  const { user, role } = useAuth();
  const { chat, setChat, isSending, onSendMessage, onEditMessage, onFeedback, onRegenerate, onReport, onCancel } = useApp();
  const pathname = usePathname();

  // This effect ensures that when the user navigates to the base /chat page,
  // the active chat is cleared, showing the welcome screen.
  useEffect(() => {
    // If there is an active chat and the URL is just /chat (not /chat/[id]), clear it.
    if (chat && pathname === '/chat') {
      setChat(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <ChatView
      chat={chat} // Pass null to show the welcome screen if no chat is active
      isSending={isSending}
      onSendMessage={onSendMessage}
      onEditMessage={onEditMessage}
      onFeedback={onFeedback}
      onRegenerate={onRegenerate}
      userRole={role}
      onReport={onReport}
      onCancel={onCancel}
    />
  );
}
