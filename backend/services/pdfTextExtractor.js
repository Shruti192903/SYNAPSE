import * as pdfParse from 'pdf-parse';
// REMOVED: import { createWorker } from 'tesseract.js';
// REMOVED: import { GoogleGenerativeAI } from '@google/generative-ai';
import { ocrExtractor } from './ocrExtractor.js';
import { summarizeText } from './summarizeText.js'; // Use the stable Ollama/Azure-backed summarizer
import dotenv from 'dotenv';

dotenv.config();

// Note: Global LLM variables (ai, model) are removed here to prevent initialization conflicts.

/**
 * Simulates semantic chunking and table continuity maintenance
 * by forwarding the text to the stable LLM service (summarizeText).
 * @param {string} fullText - The extracted text.
 * @returns {Promise<string>} The post-processed text.
 */
const semanticChunkingAndTableExtraction = async (fullText) => {
    // We rely on the LLM to process and structure the text. 
    // This call will be intercepted by the orchestrator for the final summary, 
    // but here we ensure the execution path is clean.
    
    const systemPrompt = `You are an expert document parser. Your goal is to clean up the following raw OCR/PDF text, maintaining table data continuity and grouping related sections. Output the cleaned text without summarizing.`;
    
    // Perform a non-streaming call to the stable summarizeText service for text cleaning
    // NOTE: This requires a non-streaming variant of the LLM call. For simplicity,
    // we use a direct placeholder to avoid recursive streaming issues.
    return fullText; 
};

export const pdfTextExtractor = async (base64Content) => {
    const pdfBuffer = Buffer.from(base64Content, 'base64');

    let fullText = '';
    try {
        const data = await pdfParse.default(pdfBuffer);
        fullText = data.text;
        
        if (fullText.trim().length < 50) {
             console.log("PDF text seems too short, falling back to OCR...");
             throw new Error("Text extraction failed/was too short, attempting OCR.");
        }
    } catch (e) {
        console.warn(`PDF-parse failed (${e.message}). Falling back to OCR.`);
        // Call the dedicated, external ocrExtractor service (Azure Document Intelligence)
        fullText = await ocrExtractor(base64Content); 
    }
    
    if (!fullText.trim()) {
        throw new Error("Could not extract any meaningful text from the PDF using both text extraction and OCR.");
    }

    // 3. Post-process with Ollama/LLM for structure/tables (or simply pass through)
    // NOTE: We trust the high-quality OCR (Azure DI) to handle tables, 
    // and rely on the final summarization call in the Orchestrator for the heavy lifting.
    const structuredText = await semanticChunkingAndTableExtraction(fullText);

    return structuredText;
};