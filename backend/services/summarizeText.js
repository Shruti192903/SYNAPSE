// import dotenv from 'dotenv';
// import fetch from 'node-fetch';

// dotenv.config();

// const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
// const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// export const summarizeText = async (text, onToken, systemPrompt = 'You are a helpful knowledge agent. Provide a concise, professional summary of the content.') => {
//   try {
//     const response = await fetch(OLLAMA_ENDPOINT, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         model: OLLAMA_MODEL,
//         prompt: `SYSTEM: ${systemPrompt}\nUSER: ${text}`,
//         stream: false,
//       }),
//     });

//     if (!response.ok) {
//       const errorBody = await response.text();
//       throw new Error(`Ollama API error! Status: ${response.status}. Body: ${errorBody.substring(0, 200)}`);
//     }

//     const data = await response.json();
//     const fullResponseText = data.response || '';

//     if (onToken) {
//       for (let i = 0; i < fullResponseText.length; i++) {
//         onToken('text', fullResponseText[i]);
//         await new Promise((resolve) => setTimeout(resolve, 5));
//       }
//     }

//     return fullResponseText;
//   } catch (error) {
//     console.error('Ollama communication failed:', error);
//     throw new Error(`Ollama Communication Failed: ${error.message}. Is Ollama running?`);
//   }
// };

// backend/services/summarizeText.js (Ultra-Stable Placeholder)
// backend/services/summarizeText.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeText(text, onToken) {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: `Summarize this:\n${text}` }] }],
  });

  for await (const item of result.stream) {
    const token = item?.text();
    if (token) onToken("text", token);
  }
}
