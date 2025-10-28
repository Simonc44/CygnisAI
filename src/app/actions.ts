'use server';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { continueChat } from '@/ai/flows/chat-flow';
import type { ServerChatInput, ChatOutput } from '@/ai/schemas';
import { ServerChatInputSchema } from '@/ai/schemas';
// Admin actions are removed for now as they require a different setup without direct admin SDK access from the client code.
// We will focus on client-side security via Firestore rules.
// We keep submitMessageAction as it's a core AI functionality that can be secured at the API level.

/**
 * Submits a message to the chat flow for processing.
 * This is the primary server action for handling AI interactions.
 *
 * @param input The validated chat input from the client.
 * @returns A promise that resolves to the AI's output.
 */
export async function submitMessageAction(
  input: ServerChatInput,
): Promise<ChatOutput> {
  const validation = ServerChatInputSchema.safeParse(input);

  if (!validation.success) {
    const error = validation.error.format()._errors.join('\n');
    console.error("Erreur de validation dans submitMessageAction:", error);
    return { error: `Les données d'entrée sont invalides : ${error}` };
  }

  const validatedInput = validation.data;
  
  // NOTE: The getMemoriesAction was removed as it relied on firebase-admin.
  // In a full client-side architecture, memories would be fetched on the client
  // and passed to this server action if needed. For now, we simplify.
  
  let finalSystemPrompt = validatedInput.systemPrompt || '';

  let finalMessage = validatedInput.message;
  if (validatedInput.documentContent) {
      finalMessage = `${validatedInput.documentContent}\n\n---\n\n${validatedInput.message}`;
  }
  
  const finalInput = { ...validatedInput, systemPrompt: finalSystemPrompt, message: finalMessage };
  
  try {
    const result = await continueChat(finalInput);
    if (result.error) {
      return result;
    }
    return result;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { error: 'Génération annulée' };
    }
    return { error: e.message };
  }
}

// All other actions that were using firebase-admin are removed.
// They will be replaced by client-side Firestore operations
// secured by Firestore Security Rules.
