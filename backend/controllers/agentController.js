import { agentOrchestrator } from '../services/agentOrchestrator.js';
import { sendEmail } from '../services/sendEmail.js';

// Helper to stream chunks
const streamResponse = (res, type, data) => {
    const chunk = JSON.stringify({ type, data }) + '\n';
    res.write(chunk);
};

export const handleAgentRequest = async (req, res) => {
    const { message, fileType, fileName } = req.body;
    const file = req.file;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    // Set up headers for streaming
    res.writeHead(200, {
        'Content-Type': 'application/jsonl', // JSON Lines for streaming
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
    });

    try {
        const payload = {
            message,
            file: file ? file.buffer.toString('base64') : null,
            fileName,
            fileType,
        };

        const onToken = (type, data) => {
            // Stream thoughts and final output
            if (type === 'thought' || type === 'text') {
                streamResponse(res, type, data);
            } else if (type === 'final_output' || type === 'email_preview' || type === 'table' || type === 'chart') {
                streamResponse(res, type, data);
            }
        };

        await agentOrchestrator(payload, onToken);

    } catch (error) {
        console.error('Agent Orchestrator Error:', error);
        streamResponse(res, 'error', `An unexpected error occurred: ${error.message}`);
    } finally {
        res.end();
    }
};

export const handleSendEmail = async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Missing required email fields (to, subject, html).' });
    }

    try {
        await sendEmail({ to, subject, html });
        res.status(200).json({ success: true, message: `Email successfully sent to ${to}.` });
    } catch (error) {
        console.error('Email sending failed:', error);
        res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
    }
};