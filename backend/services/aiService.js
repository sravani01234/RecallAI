import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model priority list — tries each in order until one works
const CHAT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
];

const EMBED_MODELS = [
  'gemini-embedding-2',
  'gemini-embedding-001',
];

// Retry helper — retries on 503 (overloaded) and 429 (rate limit) with backoff
const withRetry = async (fn, retries = 2, delayMs = 1500) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err.status === 503 || err.status === 429;
      if (retryable && attempt < retries) {
        console.warn(`Retrying after ${delayMs * (attempt + 1)}ms (attempt ${attempt + 1}/${retries}) — status ${err.status}`);
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      } else {
        throw err;
      }
    }
  }
};

// Function to generate embeddings — tries models in order
export const generateEmbedding = async (text) => {
  let lastErr;
  for (const model of EMBED_MODELS) {
    try {
      const response = await withRetry(() =>
        ai.models.embedContent({ model, contents: text })
      );
      return response.embeddings[0].values;
    } catch (err) {
      console.error(`Embedding failed with ${model}:`, err.status ?? err.message);
      lastErr = err;
    }
  }
  throw lastErr;
};

// Function to split text into chunks with overlap
export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
    if (i + overlap >= text.length) break;
  }
  return chunks;
};

// Function to generate text completion — tries chat models in order with retry
export const generateCompletion = async (prompt, systemInstruction = '', image = null) => {
  // Always use proper contents format
  const parts = [];
  if (prompt) parts.push({ text: prompt });
  if (image) {
    parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
  }
  const contents = [{ role: 'user', parts }];

  let lastErr;
  for (const model of CHAT_MODELS) {
    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model,
          contents,
          config: systemInstruction ? { systemInstruction } : undefined,
        })
      );
      return response.text;
    } catch (err) {
      const status = err.status;
      // Only try next model for overload/quota; re-throw other errors
      if (status === 503 || status === 429 || status === 404) {
        console.warn(`${model} failed (${status}), trying next model…`);
        lastErr = err;
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};
