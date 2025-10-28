
import type { Timestamp } from 'firebase/firestore';
import type { LucideIcon } from 'lucide-react';
import type { Source } from '@/ai/schemas';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isLoading?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  documentContent?: string;
  code?: {
    language: string;
    content: string;
  };
  sources?: Source[];
  feedback?: 'good' | 'bad';
  createdAt: string; 
  thinking?: string | null;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  userId: string; // The original creator of the chat
  members: string[]; // Array of user UIDs who have access
  systemPrompt?: string;
  isArchived?: boolean;
  projectId?: string;
}

export type UserRole = 'guest' | 'free' | 'pro' | 'admin';

export interface AppUser {
    uid: string;
    email: string;
    displayName: string;
    disabled: boolean;
    creationTime: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelId: string;
  icon: string; // Lucide icon name as string
  userId: string;
  originalAuthorId?: string;
  originalAuthorName?: string;
}

export interface Memory {
  id: string;
  fact: string;
  userId:string;
  chatId: string;
  createdAt: Date;
}

export interface Feedback {
    id: string;
    userId: string;
    chatId: string;
    createdAt: Date;
    status: 'pending' | 'corrected' | 'ignored';
    userQuery: string;
    modelResponse: string;
    correctedResponse?: string;
}

export interface TrainingData {
    id: string;
    question: string;
    idealAnswer: string;
    addedBy: string; // Admin's UID
    createdAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAt: Date;
}
