// backend/services/ocrExtractor.js

import Tesseract from "tesseract.js";
const { default: pdfParse } = await import("pdf-parse");


export async function ocrExtractor(buffer) {
  const { default: pdfParse } = await import("pdf-parse");
  const result = await pdfParse(buffer);
  return result.text;
}



