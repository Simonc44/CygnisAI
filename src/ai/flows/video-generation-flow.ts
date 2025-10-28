
'use server';
/**
 * @fileOverview Flow to generate a video from a text prompt using Genkit and Google's Veo model.
 */

import { ai } from '@/ai/genkit';
import { MediaPart } from 'genkit';

async function toBase64(videoUrl: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch video from ${videoUrl}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

export async function generateVideo(prompt: string): Promise<{ videoUrl: string, contentType: string }> {
    console.log(`Requesting video generation for prompt: "${prompt}"`);

    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("La clé d'API Google (GOOGLE_API_KEY) est manquante dans les variables d'environnement.");
    }
    
    try {
        let { operation } = await ai.generate({
            model: 'googleai/veo-2.0-generate-001',
            prompt: prompt,
            config: {
                durationSeconds: 5,
                aspectRatio: '16:9',
            },
        });

        if (!operation) {
            throw new Error('Expected the model to return an operation');
        }

        // Poll for the result
        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
            operation = await ai.checkOperation(operation);
        }

        if (operation.error) {
            throw new Error('Video generation failed: ' + operation.error.message);
        }

        const video = operation.output?.message?.content.find((p) => !!p.media);
        if (!video || !video.media?.url) {
            throw new Error('Failed to find the generated video in the operation result.');
        }

        const videoDownloadUrl = `${video.media.url}&key=${process.env.GOOGLE_API_KEY}`;
        const contentType = video.media.contentType || 'video/mp4';

        // Convert to data URI to send to client
        const base64Data = await toBase64(videoDownloadUrl);
        const videoDataUri = `data:${contentType};base64,${base64Data}`;

        console.log('Successfully received and encoded video.');
        return { videoUrl: videoDataUri, contentType };

    } catch (error: any) {
        console.error('Error calling video generation function:', error);
        throw new Error(error.message || 'An unexpected error occurred during video generation.');
    }
}
