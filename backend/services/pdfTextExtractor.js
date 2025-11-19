import * as pdfParse from 'pdf-parse';
import { ocrExtractor } from './ocrExtractor.js';
import { summarizeText } from './summarizeText.js';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config();

/**
 * Placeholder for semantic chunking that relies on the stable LLM service.
 */
const semanticChunkingAndTableExtraction = async (fullText) => {
    return fullText; 
};

export const pdfTextExtractor = async (base64Content, fileName) => {
    const pdfBuffer = Buffer.from(base64Content, 'base64');

    let fullText = '';
    try {
        // FIX: Safely access the pdf-parse function (handles both .default and root exports)
        const parser = pdfParse.default || pdfParse; 
        const data = await parser(pdfBuffer);
        fullText = data.text;
        
        if (fullText.trim().length < 50) {
             console.log("PDF text seems too short, falling back to OCR...");
             throw new Error("Text extraction failed/was too short, attempting OCR.");
        }
    } catch (e) {
        console.warn(`PDF-parse failed (${e.message}). Falling back to OCR.`);
        // Call the external ocrExtractor service (Azure Document Intelligence - SIMULATED)
        fullText = await ocrExtractor(base64Content, fileName); 
    }
    
    if (!fullText.trim()) {
        throw new Error("Could not extract any meaningful text from the PDF using both text extraction and OCR.");
    }

    // 3. Post-process with LLM for structure/tables
    const structuredText = await semanticChunkingAndTableExtraction(fullText);

    return structuredText;
};