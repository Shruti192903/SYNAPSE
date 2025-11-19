import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('./backend/.env') });

console.log('AZURE_DI_ENDPOINT:', process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT);
console.log('AZURE_DI_KEY:', process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);


// const runTest = async () => {
//   const pdfBuffer = fs.readFileSync('Content_Repository.pdf'); // make sure this file is in the same folder
//   const base64Content = pdfBuffer.toString('base64');

//   try {
//     const text = await ocrExtractor(base64Content);
//     console.log('Extracted text:', text);
//   } catch (err) {
//     console.error('OCR Extraction Failed:', err);
//   }
// };

// runTest();
