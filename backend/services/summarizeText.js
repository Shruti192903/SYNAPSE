import dotenv from 'dotenv';
import fetch from 'node-fetch'; 

dotenv.config();

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'; 

/**
 * Streams a summary/response from Ollama (Llama 3.2).
 */
export const summarizeText = async (text, onToken, systemPrompt = "You are a helpful knowledge agent. Provide a concise, professional summary of the content.") => {
    let fullSummary = '';

    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: `SYSTEM: ${systemPrompt}\nUSER: ${text}`,
                stream: true, 
            }),
        });

        if (!response.ok || !response.body) {
            const errorBody = await response.text();
            throw new Error(`Ollama API error! Status: ${response.status}. Body: ${errorBody.substring(0, 100)}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            while (buffer.includes('\n')) {
                const parts = buffer.split('\n');
                const sseChunk = parts.shift();
                buffer = parts.join('\n');

                if (sseChunk.trim().length > 0) {
                    try {
                        const data = JSON.parse(sseChunk);
                        const token = data.response;

                        if (token) {
                            fullSummary += token;
                            onToken('text', token);
                        }
                        if (data.done) return fullSummary; // Explicit return if Ollama signals done

                    } catch (e) {
                        // Ignore potential JSON parsing errors
                    }
                }
            }
        }
        return fullSummary;
    } catch (error) {
        console.error('Ollama streaming failed:', error);
        throw new Error(`Ollama Streaming Failed: ${error.message}. Is Ollama running?`);
    }
};