import { Router } from 'express';
import { handleAgentRequest, handleSendEmail } from '../controllers/agentController.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Main agent route - handles command and file upload
router.post('/chat', upload.single('file'), handleAgentRequest);

// Route for sending an email after previewing
router.post('/send-email', handleSendEmail);

export default router;