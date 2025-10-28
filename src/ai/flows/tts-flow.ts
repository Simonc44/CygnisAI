'use server';
/**
 * @fileOverview Flow to convert text to speech using Genkit and Google's TTS model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const TTSOutputSchema = z.object({
  audioUrl: z.string().describe("The data URI of the generated audio file."),
});

const ttsFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.string(),
    outputSchema: TTSOutputSchema,
  },
  async (text) => {
    console.log(`Requesting TTS for text: "${text.substring(0, 50)}..."`);
    
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("La clé d'API Google (GOOGLE_API_KEY) est manquante dans les variables d'environnement.");
    }

    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        prompt: text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard female voice
            },
          },
        },
      });

      if (!media || !media.url) {
        throw new Error('TTS generation failed, no media returned.');
      }
      
      // The model returns raw PCM data in a data URI, we need to convert it to a WAV file
      const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
      const wavData = await toWav(pcmData);

      return {
        audioUrl: `data:audio/wav;base64,${wavData}`,
      };

    } catch (error: any) {
      console.error('Error in textToSpeechFlow:', error);
      throw new Error(error.message || 'An unexpected error occurred during text-to-speech conversion.');
    }
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000, // Gemini TTS sample rate
  sampleWidth = 2 // 16-bit
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const buffers: any[] = [];
    writer.on('error', reject);
    writer.on('data', (chunk) => buffers.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}


export async function textToSpeech(text: string): Promise<string> {
    const { audioUrl } = await ttsFlow(text);
    return audioUrl;
}
