
'use server';
/**
 * @fileOverview Flow to learn from a URL using Genkit.
 */
import { LearnFromUrlInput, LearnFromUrlInputSchema } from '@/ai/schemas';
import { ai } from '@/ai/genkit';
import * as cheerio from 'cheerio';
import { z } from 'zod';

async function fetchAndClean(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header, aside').remove();

    // Get text from the body
    let text = $('body').text();
    
    // Clean up whitespace
    text = text.replace(/\s\s+/g, ' ').trim();
    
    return text.slice(0, 15000); // Limit context size
}

const InternalUrlLearningInputSchema = z.object({
    url: z.string(),
    prompt: z.string().optional(),
    pageContent: z.string(),
});

const urlLearningPrompt = ai.definePrompt({
    name: 'urlLearningPrompt',
    input: { schema: InternalUrlLearningInputSchema },
    output: { schema: z.string() },
    system: "You are a web content analysis assistant. You will receive text from a web page and a user question. Answer the question based exclusively on the provided content.",
    prompt: `Here is the content of the page {{url}}:\n\n---\n{{pageContent}}\n---\n\nMy question is: {{prompt}}`
});

const urlLearningFlow = ai.defineFlow(
    {
        name: 'urlLearningFlow',
        inputSchema: LearnFromUrlInputSchema,
        outputSchema: z.string(),
    },
    async ({ url, prompt }) => {
        console.log(`Learning from URL: "${url}" with prompt: "${prompt}"`);
        const pageContent = await fetchAndClean(url);

        const { output } = await urlLearningPrompt({
            url,
            prompt: prompt || "Summarize the key points for me.",
            pageContent,
        });

        if (!output) {
            throw new Error('URL learning failed, no output returned.');
        }
        return output;
    }
);


 export async function learnFromUrl({ url, prompt }: LearnFromUrlInput): Promise<string> {
    try {
        return await urlLearningFlow({ url, prompt });
    } catch (error: any) {
        console.error('Error calling URL learning function:', error);
        throw new Error(error.message || 'An unexpected error occurred during URL learning.');
    }
}
