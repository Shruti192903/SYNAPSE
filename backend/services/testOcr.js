import { runOcrPipeline } from './services/ocrPipeline.js';

const result = await runOcrPipeline({
    filePath: './Content_Repository.pdf'
});

console.log(result);
