
'use server';
/**
 * @fileOverview Flow to generate code from a text prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';


const CodeGenerationOutputSchema = z.object({
  code: z.string().describe("The generated code block."),
  language: z.string().describe("The programming language of the code (e.g., 'typescript', 'javascript')."),
});

const codeGenerationPrompt = ai.definePrompt({
    name: 'codeGenerationPrompt',
    input: { schema: z.string() },
    output: { schema: CodeGenerationOutputSchema },
    prompt: `
        You are an expert in code generation. Your task is to generate clean, modern, and well-documented code based on the user's request.
        The main language and frameworks are React, TypeScript, and Tailwind CSS.
        Respond ONLY with a JSON object in the following format:
        {
          "code": "...",
          "language": "..."
        }
        Ensure the code in the "code" string is properly escaped to be valid JSON.
        User request: {{{prompt}}}
    `
});


// This function calls the Genkit flow to generate code.
export async function generateCode(prompt: string): Promise<{ code: string; language: string }> {
  console.log(`Requesting code generation for prompt: "${prompt}"`);

  try {
    const { output } = await codeGenerationPrompt(prompt);
    
    if (!output) {
      throw new Error('Code generation failed, no output returned.');
    }
    
    return output;
  } catch (error: any) {
    console.error('Error calling code generation flow:', error);
    throw new Error(error.message || 'An unexpected error occurred during code generation.');
  }
}
