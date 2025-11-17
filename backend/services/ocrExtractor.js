import { createWorker } from 'tesseract.js';

/**
 * Extracts text from an image (or image-based document buffer) using Tesseract.js.
 * @param {string} base64Content - The base64 string of the image file.
 * @returns {Promise<string>} The extracted text.
 */
export const ocrExtractor = async (base64Content) => {
    const buffer = Buffer.from(base64Content, 'base64');
    
    let worker;
    let extractedText = '';

    try {
        // Initialize worker
        worker = await createWorker('eng');
        
        // Recognize text
        const { data: { text } } = await worker.recognize(buffer);
        extractedText = text;
        
    } catch (error) {
        console.error('Tesseract OCR failed:', error);
        throw new Error(`OCR extraction failed: ${error.message}`);
    } finally {
        // Terminate worker to free up resources
        if (worker) {
            await worker.terminate();
        }
    }

    return extractedText;
};