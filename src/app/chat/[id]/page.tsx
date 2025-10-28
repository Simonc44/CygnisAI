
'use client';

import { ChatView } from '@/components/chat/chat-view';
import { useApp } from '@/components/app-provider';
import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/services/auth-service';
import { useParams } from 'next/navigation';
import { GenericPage } from '@/components/generic-page';
import { AlertTriangle } from 'lucide-react';

export default function ChatPageWithId() {
  const { user } = useAuth();
  const { chat, isSending, onSendMessage, onEditMessage, onFeedback, onRegenerate, onCancel, isChatLoading } = useApp();
  
  if (isChatLoading || !user) {
    return <div className="flex-1 flex items-center justify-center"><LoadingScreen message="Chargement de la discussion..."/></div>;
  }
  
  // After loading, if chat is still null, it means it doesn't exist or user is not a member.
  if (!chat) {
    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-4 text-lg font-medium">Conversation non trouvée</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Cette conversation n'existe pas ou vous n'y avez pas accès.
                </p>
            </div>
        </div>
    );
  }

  return (
    <ChatView
      chat={chat}
      isSending={isSending}
      onSendMessage={onSendMessage}
      onEditMessage={onEditMessage}
      onFeedback={onFeedback}
      onRegenerate={onRegenerate}
      onCancel={onCancel}
      userRole={chat.members.includes(user.uid) ? 'pro' : 'guest'} // Example role logic
    />
  );
}
