import express from 'express';
import fileUpload from 'express-fileupload';
import { handlePdfUpload } from '../controllers/pdfController.js';

const router = express.Router();

// Enable file uploads
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
}));

// POST /pdf/upload
router.post('/upload', handlePdfUpload);

export default router;
