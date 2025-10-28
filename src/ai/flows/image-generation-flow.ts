
'use server';
/**
 * @fileOverview Flow to generate an image from a text prompt.
 */

import { ai } from '@/ai/genkit';

/**
 * Generates an image from a text prompt using the Imagen 4 model.
 * @param prompt The text prompt for the image.
 * @returns A promise that resolves to the data URI of the generated image.
 */
export async function generateImage(prompt: string): Promise<string> {
  console.log(`Requesting image generation for prompt: "${prompt}"`);

  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: prompt,
    });
    
    const imageUrl = media.url;
    if (!imageUrl) {
        throw new Error('Image generation failed, no URL returned.');
    }
    
    console.log('Successfully received image data URI.');
    return imageUrl;

  } catch (error: any) {
    console.error('Error calling image generation flow:', error);
    // Check for specific billed user error
    if (error.message && error.message.includes('billed users')) {
        throw new Error('L\'API de génération d\'images est uniquement accessible aux utilisateurs avec un compte de facturation Google Cloud activé.');
    }
    throw new Error(error.message || 'An unexpected error occurred during image generation.');
  }
}
