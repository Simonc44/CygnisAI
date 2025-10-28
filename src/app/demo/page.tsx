'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatView } from '@/components/chat/chat-view';
import { useApp } from '@/components/app-provider';
import { useAuth } from '@/services/auth-service';
import { LoadingScreen } from '@/components/loading-screen';

export default function DemoPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    chat,
    isSending,
    onSendMessage,
    onEditMessage,
    onFeedback,
    onRegenerate,
    onReport,
    onCancel,
  } = useApp();

  // Redirect logged-in users away from the demo page
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/chat');
    }
  }, [isAuthLoading, user, router]);

  // While checking auth, show a loading screen.
  // Also covers the brief moment before redirecting a logged-in user.
  if (isAuthLoading || user) {
    return <LoadingScreen message="Chargement..." />;
  }

  // If not loading and not a user, render the chat view for guests.
  return (
    <ChatView
      chat={chat} // The useApp hook will provide the guest chat state
      isSending={isSending}
      onSendMessage={onSendMessage}
      onEditMessage={onEditMessage}
      onFeedback={onFeedback}
      onRegenerate={onRegenerate}
      userRole="guest"
      onReport={onReport}
      onCancel={onCancel}
    />
  );
}
