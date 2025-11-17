import * as pdfParse from 'pdf-parse'; // Corrected import for ES modules
import { createWorker } from 'tesseract.js';
import { ocrExtractor } from './ocrExtractor.js';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Corrected class name
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Fallback OCR for image-based PDFs (using Tesseract directly as in original plan)
const fallbackToOcr = async (base64Content) => {
    const buffer = Buffer.from(base64Content, 'base64');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
};

// Use Gemini for semantic chunking and table continuity
const semanticChunkingAndTableExtraction = async (fullText) => {
    const prompt = `You are an expert document parser. Your goal is to process the following text, which might be from a PDF.
    1. **Maintain Table Continuity:** Identify any text that looks like a table and ensure the structure or data points are logically grouped, even if they were split across lines or pages.
    2. **Semantic Chunking:** Group related paragraphs and sections into meaningful chunks (e.g., "Introduction", "Financial Summary", "Candidate Profile").
    3. **Output Format:** Return a clean, structured string where sections are clearly delineated by a unique separator (e.g., '---SECTION-BREAK---'). Do not use JSON.

    DOCUMENT TEXT:
    ---
    ${fullText}
    ---`;

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    return result.text;
};

export const pdfTextExtractor = async (base64Content) => {
    const pdfBuffer = Buffer.from(base64Content, 'base64');

    // 1. Initial attempt with pdf-parse
    let fullText = '';
    try {
        const data = await pdfParse.default(pdfBuffer); // Use .default for CJS import in ESM
        fullText = data.text;
        
        if (fullText.trim().length < 50) {
             console.log("PDF text seems too short, falling back to OCR...");
             throw new Error("Text extraction failed/was too short, attempting OCR.");
        }
    } catch (e) {
        console.warn(`PDF-parse failed (${e.message}). Falling back to OCR.`);
        // 2. Fallback to Tesseract OCR
        fullText = await fallbackToOcr(base64Content);
    }
    
    if (!fullText.trim()) {
        throw new Error("Could not extract any meaningful text from the PDF using both text extraction and OCR.");
    }

    // 3. Post-process with Gemini for structure/tables
    const structuredText = await semanticChunkingAndTableExtraction(fullText);

    return structuredText;
};