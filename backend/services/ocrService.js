import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

const AZURE_OCR_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const AZURE_OCR_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

export async function extractPdfText(buffer) {
  // Try pdf-parse extraction
  const pdfData = await pdfParse(buffer);
  if (pdfData.text && pdfData.text.length > 50) {
    return pdfData.text;
  }

  // Fallback Azure OCR logic (simplified)
  if (!AZURE_OCR_ENDPOINT || !AZURE_OCR_KEY) {
    throw new Error('Azure OCR credentials missing');
  }

  const res = await fetch(`${AZURE_OCR_ENDPOINT}/documentModels/prebuilt-layout:analyze?api-version=2023-10-31`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Ocp-Apim-Subscription-Key': AZURE_OCR_KEY,
    },
    body: buffer,
  });

  const operationLocation = res.headers.get('operation-location');
  if (!operationLocation) throw new Error('No operation-location from Azure');

  // Polling for result (simplified, add retries as needed)
  let result;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const pollRes = await fetch(operationLocation, {
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_OCR_KEY },
    });
    result = await pollRes.json();
    if (result.status === 'succeeded') break;
  }
  if (!result || result.status !== 'succeeded') throw new Error('Azure OCR failed');

  // Return combined text
  const combinedText = result.analyzeResult?.readResults?.map(page => page.lines.map(line => line.text).join(' ')).join('\n');
  return combinedText || '';
}
