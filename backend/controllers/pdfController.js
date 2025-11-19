import { extractPdfText } from '../services/extractPdfText.js';

export const handlePdfUpload = async (req, res) => {
  try {
    const file = req.files.pdf; // assuming frontend sends "pdf" file
    const base64Content = file.data.toString('base64');

    const result = await extractPdfText(base64Content);

    res.json({
      rawText: result.fullText,
      summary: result.summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
