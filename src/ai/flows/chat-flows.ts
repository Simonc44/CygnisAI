
'use server';

import type { ChatOutput, ServerChatInput } from '@/ai/schemas';

// Configuration de l'API OpenRouter
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; 
const YOUR_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const YOUR_SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ||'CygnisAI';

// Configuration de l'API Cygnis A1
const CYGNIS_API_URL = 'https://cygnis-ai-studio.vercel.app/api/ask';
const CYGNIS_API_KEY = process.env.CYGNIS_API_KEY;


/**
 * Continue une conversation en utilisant l'API sélectionnée (Cygnis ou OpenRouter).
 * @param input Les données d'entrée du chat.
 * @returns Une promesse qui se résout avec la sortie du modèle.
 */
export async function continueChat(input: ServerChatInput): Promise<ChatOutput> {
  try {
    if (!input.message || typeof input.message !== 'string' || input.message.trim() === '') {
      throw new Error('Message utilisateur invalide ou manquant.');
    }

    // Clone the input to avoid mutating the original object, which can cause state issues on subsequent calls.
    const finalInput = { ...input };

    // --- SPECIAL COMMAND HANDLING ---
    if (finalInput.message.startsWith('system:translate:')) {
        const parts = finalInput.message.split(':');
        const lang = parts[2];
        const textToTranslate = parts.slice(3).join(':');

        const translationPrompt = `
Traduire le texte suivant en ${lang}.
Je veux que la réponse soit **uniquement** une table Markdown avec deux colonnes : la langue d'origine (Français) et la langue de destination (${lang}).

**Texte à traduire :**
"${textToTranslate}"

**Exemple de format de réponse attendu :**
| Français | ${lang} |
|---|---|
| Bonjour | Hello |
        `;
        
        // We override the user message to be the specialized prompt
        finalInput.message = translationPrompt;
        // It's better to remove chat history for such a direct command to avoid confusion for the model
        finalInput.chatHistory = []; 
    }

    const modelToUse = finalInput.modelId || 'cygnis-a1';
    let responseText: string;
    let sources: ChatOutput['sources'] = [];
    
    if (modelToUse === 'cygnis-a1') {
      if (!CYGNIS_API_KEY) {
        throw new Error('La clé d\'API Cygnis est manquante. Veuillez configurer la variable d\'environnement CYGNIS_API_KEY.');
      }
      
      const response = await fetch(CYGNIS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CYGNIS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: finalInput.message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `L'API Cygnis a retourné une erreur ${response.status}`);
      }
      
      const data = await response.json();
      responseText = data.answer || "Le modèle Cygnis n'a pas pu générer de réponse.";
      sources = data.sources || [];

    } else {
      if (!OPENROUTER_API_KEY) {
        throw new Error('La clé d\'API OpenRouter est manquante. Veuillez configurer la variable d\'environnement OPENROUTER_API_KEY.');
      }

      const messagesForOpenRouter: any[] = [];
      if (finalInput.systemPrompt) {
          messagesForOpenRouter.push({ role: 'system', content: finalInput.systemPrompt });
      }
      messagesForOpenRouter.push(...finalInput.chatHistory.map(m => ({ role: m.role, content: m.content })));

      const userMessageContent: any[] = [{ type: 'text', text: finalInput.message }];
      if (finalInput.imageUrl) {
        userMessageContent.push({
          type: 'image_url',
          image_url: { url: finalInput.imageUrl },
        });
      }
      messagesForOpenRouter.push({ role: 'user', content: userMessageContent });


      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messagesForOpenRouter,
        }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `L'API OpenRouter a retourné une erreur ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || "Le modèle OpenRouter n'a pas pu générer de réponse.";
    }
    
    return { text: responseText, sources };

  } catch (e: any) {
    console.error(`Erreur dans continueChat:`, e);
    // Return a structured error to be handled by the client
    return { error: e.message || 'An unknown error occurred' };
  }
}
