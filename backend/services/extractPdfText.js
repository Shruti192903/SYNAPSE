// backend/services/extractPdfText.js
import { ocrExtractor } from './ocrExtractor.js';
import { summarizeText } from './summarizeText.js';
import * as pdfParse from 'pdf-parse'; // Correct ESM import
import { Buffer } from 'buffer';

export const extractPdfText = async (base64Content) => {
  let fullText = '';
  const buffer = Buffer.from(base64Content, 'base64');

  try {
    // pdf-parse returns a promise
    const pdfData = await pdfParse.default(buffer); // Use .default
    fullText = pdfData.text;
  } catch (error) {
    console.warn('PDF-parse failed, falling back to OCR:', error.message);
    fullText = await ocrExtractor(base64Content);
  }

  // Summarize using LLM
  const summary = await summarizeText(fullText);

  return { fullText, summary };
};
