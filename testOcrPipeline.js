import dotenv from 'dotenv';
import { ocrExtractor } from './backend/services/ocrExtractor.js';

import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve('./backend/.env') });


const runTest = async () => {
    try {
        const pdfBuffer = fs.readFileSync('Content_Repository.pdf');
        const base64Content = pdfBuffer.toString('base64');

        const text = await ocrExtractor(base64Content);
        console.log('Extracted Text:\n', text);
    } catch (error) {
        console.error('OCR Extraction Failed:', error);
    }
};

runTest();
