import dotenv from 'dotenv';
import fetch from 'node-fetch'; 

dotenv.config();

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const TOOL_NAMES = [
    'extract_pdf_text', 'extract_csv_data', 'run_ocr', 'analyze_data',
    'generate_offer_letter', 'verify_claims', 'web_search', 'send_email', 'general_query',
];

const INTENT_SYSTEM_PROMPT = `
You are an intelligent Intent Detection and Tool Routing Agent. Your task is to analyze the user's message and the available file to determine the single, best next step (tool) and any required arguments.

Available Tools:
- extract_pdf_text: Use for summarizing/processing PDF content.
- extract_csv_data: Use for analyzing CSV data.
- general_query: Use for simple questions.

Return ONLY a simple JSON object with 'tool' and 'argument'. Example: {"tool": "extract_pdf_text", "argument": "Summarize the pdf"}. Do not include any explanation or markdown.
`;

export const intentDetector = async (message, fileType) => {
    let context = fileType ? `The user has provided a file of type: ${fileType}.` : `No file has been provided by the user.`;
    const fullPrompt = `${INTENT_SYSTEM_PROMPT}\n\nCONTEXT: ${context}\n\nUSER MESSAGE: "${message}"`;

    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: fullPrompt,
                stream: false, // Non-streaming call for single JSON output
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API failed: ${response.status}`);
        }
        
        const data = await response.json();
        const rawText = data.response;
        
        // Use a robust regex to extract the first valid JSON block
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Ollama failed to return a valid JSON structure.");
        }
        
        const result = JSON.parse(jsonMatch[0].trim());

        if (!TOOL_NAMES.includes(result.tool)) {
             console.warn(`Model returned invalid tool: ${result.tool}. Falling back to general_query.`);
             return { tool: 'general_query', argument: message };
        }
        
        return result;

    } catch (error) {
        console.error('Intent detection failed:', error);
        // CRITICAL: We must re-throw a clean error string, not the object.
        throw new Error(`Intent detection failed: ${error.message}`); 
    }
};