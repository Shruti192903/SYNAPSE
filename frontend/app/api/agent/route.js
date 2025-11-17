// This file acts as the Next.js API route proxy to the Express Backend.
// It is crucial for handling file uploads and streaming responses correctly within the Next.js environment.

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    // Forward the FormData directly to the Express backend
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/agent/chat`, {
      method: 'POST',
      body: formData,
      // The backend should handle the 'Content-Type: multipart/form-data' from the form-data library automatically
    });

    if (!response.ok) {
      // Attempt to read error message from the backend
      let errorText = await response.text();
      try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error || errorText;
      } catch (e) {
          // not a JSON error
      }
      
      return NextResponse.json({ error: `Backend Error (${response.status}): ${errorText}` }, { status: response.status });
    }

    // Pass the streaming response directly through to the client
    // The ReadableStream in the Fetch API response is what we need.
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'application/jsonl', // Match the backend's JSON Lines format
      },
    });

  } catch (error) {
    console.error('Next.js API proxy error:', error);
    return NextResponse.json({ error: 'Failed to connect to the agent backend.' }, { status: 500 });
  }
}