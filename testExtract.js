// testExtract.js
import { extractPdfText } from './backend/services/extractPdfText.js';
import fs from 'fs';

const runTest = async () => {
    try {
        const pdfBuffer = fs.readFileSync('Content_Repository.pdf'); // make sure the PDF is in the same folder
        const base64Content = pdfBuffer.toString('base64');

        const result = await extractPdfText(base64Content);
        console.log('Raw Text:\n', result.fullText);
        console.log('\nSummary:\n', result.summary);
    } catch (error) {
        console.error('PDF Extraction Failed:', error);
    }
};

runTest();
