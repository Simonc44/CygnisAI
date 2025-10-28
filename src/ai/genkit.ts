
/**
 * @fileoverview This file initializes and configures the Genkit AI toolkit.
 * It sets up the necessary plugins (e.g., Google AI for Gemini and Imagen models)
 * and exports a configured `ai` instance for use throughout the application.
 */

import { genkit, type GenkitErrorCode, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin.
// The plugin will automatically use the GOOGLE_API_KEY from your environment variables.
export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
  ],
});

/**
 * Checks if an error is a GenkitError.
 * @param error The error to check.
 * @returns True if the error is a GenkitError, false otherwise.
 */
export function isGenkitError(error: any): error is GenkitError {
  return error && typeof error.isGenkitError === 'boolean' && error.isGenkitError;
}

/**
 * Gets the error code from a GenkitError.
 * @param error The GenkitError.
 * @returns The error code.
 */
export function getGenkitErrorCode(error: GenkitError): GenkitErrorCode {
  return error.code;
}
