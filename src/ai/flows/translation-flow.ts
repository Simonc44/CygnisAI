'use server';
/**
 * @fileOverview Flow to translate text from one language to another.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the translation flow
const TranslationInputSchema = z.object({
  text: z.string().describe("The text to be translated."),
  targetLanguage: z.string().describe("The target language for the translation (e.g., 'French', 'English')."),
});

// Define the output schema for the translation flow
const TranslationOutputSchema = z.string().describe("The translated text.");

// Define the Genkit prompt for translation
const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: { schema: TranslationInputSchema },
  output: { schema: TranslationOutputSchema },
  prompt: `Translate the following text into {{targetLanguage}}. Respond only with the translated text, without any additional explanations or context.

Text to translate:
"{{text}}"`,
  config: {
    temperature: 0.2, // Use a lower temperature for more deterministic translations
  },
});

// Define the main translation flow
const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async (input) => {
    // Call the prompt with the specified model
    const { output } = await translationPrompt(input, { model: 'gemini-1.5-flash' });
    
    if (!output) {
      throw new Error('Translation failed, no output returned.');
    }
    
    // The output is already a string, as defined by TranslationOutputSchema
    return output;
  }
);

// Export a wrapper function to be used by server actions
export async function translateText(input: z.infer<typeof TranslationInputSchema>): Promise<string> {
  console.log(`Requesting translation to "${input.targetLanguage}" for text: "${input.text.substring(0, 50)}..."`);
  try {
    const translatedText = await translationFlow(input);
    return translatedText;
  } catch (error: any) {
    console.error('Error in translateText function:', error);
    throw new Error(error.message || 'An unexpected error occurred during translation.');
  }
}
