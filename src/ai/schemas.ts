
import { z } from 'zod';

export const LearnFromUrlInputSchema = z.object({
  url: z.string().url(),
  prompt: z.string().optional(),
});
export type LearnFromUrlInput = z.infer<typeof LearnFromUrlInputSchema>;

// Schéma pour la saisie du chat
export const ChatInputSchema = z.object({
  userId: z.string(),
  chatId: z.string().nullable(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'system']),
    content: z.string(),
  })),
  message: z.string(),
  imageUrl: z.string().optional(),
  modelId: z.string().optional(),
  responseStyle: z.string().optional(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Schéma pour les sources
const SourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

const ChatOutputCodeSchema = z.object({
  language: z.string().describe("Le langage de programmation du code (ex: 'typescript', 'javascript')."),
  content: z.string().describe("Le bloc de code généré."),
});


// Type de sortie pour le chat, maintenant plus structuré
export const ChatOutputSchema = z.object({ 
  text: z.string().optional(),
  code: ChatOutputCodeSchema.optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  thinking: z.string().nullable().optional(),
  error: z.string().optional(),
  sources: z.array(SourceSchema).optional(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;



// --- Types for Server Actions ---

export type ActionOutput = { 
  text: string;
  code?: { language: string; content: string; };
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  sources?: Source[];
};

export const ServerChatInputSchema = z.object({
  userId: z.string(),
  chatId: z.string().nullable(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  message: z.string(),
  imageUrl: z.string().optional(),
  documentContent: z.string().optional(),
  modelId: z.string().optional(),
  responseStyle: z.string().optional(),
  systemPrompt: z.string().optional(),
});
export type ServerChatInput = z.infer<typeof ServerChatInputSchema>;
