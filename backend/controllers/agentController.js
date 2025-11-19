export async function handleAgentAction(req, res) {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { message, file, fileType, fileName } = req.body; // file expected as base64

    await agentOrchestrator({ message, file, fileType, fileName, res });
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: err.message })}\n\n`);
    res.end();
  }
}
