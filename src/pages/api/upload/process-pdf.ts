import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { processPDF } from '../../../utils/pdfProcessor';
import { WaterTreatmentAgent } from '../../../utils/agentWorkflow';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create vectors directory if it doesn't exist
    const vectorsDir = path.join(process.cwd(), 'vectors');
    if (!fs.existsSync(vectorsDir)) {
      fs.mkdirSync(vectorsDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      // Clean up the uploaded file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Process the PDF
    const processedDoc = await processPDF(file.filepath);

    // Initialize the workflow agent
    const agent = new WaterTreatmentAgent(process.env.OPENAI_API_KEY);
    
    // Start the workflow
    const workflowResult = await agent.executeWorkflow({
      processedDocument: processedDoc
    });

    // Clean up the uploaded file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      message: 'Workflow completed successfully',
      status: workflowResult.status,
      progress: workflowResult.progress,
      results: workflowResult.results
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ error: 'Error processing file' });
  }
}
