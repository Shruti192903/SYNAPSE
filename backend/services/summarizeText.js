import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Streaming summarization from Ollama
 * Properly handles response.body with getReader()
 */
export const summarizeText = async (
  text,
  onToken = () => {},
  systemPrompt = "You are a helpful knowledge agent. Provide a concise professional summary."
) => {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Input text cannot be empty');
    }

    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `SYSTEM: ${systemPrompt}\nUSER: ${text}`,
        stream: true, // Enable streaming
      }),
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    // Verify response.body exists (Node.js compatibility)
    if (!response.body) {
      throw new Error('Response body is null or undefined. Ensure Ollama is running at: ' + OLLAMA_ENDPOINT);
    }

    // Verify getReader exists
    if (typeof response.body.getReader !== 'function') {
      // Fallback: use text() method for non-streaming
      console.warn('getReader not available, falling back to text streaming simulation');
      const text = await response.text();
      const lines = text.trim().split('\n');
      let fullResponse = '';
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            onToken('text', data.response);
          }
        } catch (e) {
          console.warn('Failed to parse line:', line);
        }
      }
      
      return fullResponse;
    }

    // Use getReader for proper streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunk = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      chunk += text;

      // Process complete JSON lines
      const lines = chunk.split('\n');
      chunk = lines[lines.length - 1]; // Keep incomplete line

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            onToken('text', data.response);
          }
          
          // Signal completion when Ollama is done
          if (data.done === true) {
            reader.cancel();
            break;
          }
        } catch (e) {
          console.warn('Failed to parse JSON line:', line, e.message);
        }
      }
    }

    // Process any remaining chunk
    if (chunk.trim()) {
      try {
        const data = JSON.parse(chunk);
        if (data.response) {
          fullResponse += data.response;
          onToken('text', data.response);
        }
      } catch (e) {
        console.warn('Failed to parse final chunk:', chunk);
      }
    }

    return fullResponse;

  } catch (error) {
    console.error("[v0] Ollama communication failed:", {
      message: error.message,
      endpoint: OLLAMA_ENDPOINT,
      model: OLLAMA_MODEL,
      stack: error.stack
    });
    throw new Error(`Ollama Streaming Failed: ${error.message}`);
  }
};