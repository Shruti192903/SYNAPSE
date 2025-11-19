// backend/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Load environment variables from backend/.env
dotenv.config({ path: './backend/.env' });

const app = express();

// Setup Helmet with Content Security Policy to allow connections from frontend
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:8000"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  })
);

// Enable CORS for frontend at localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));

// Parse incoming JSON requests
app.use(express.json());

// Define your API route
app.post('/api/agent/chat', (req, res) => {
  // Implement your logic here
  res.json({ message: 'Response from /api/agent/chat' });
});

// 404 Handler for any other unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server on port from environment or 8000
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
