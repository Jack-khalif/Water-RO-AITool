import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { analyzeLabReport } from '../../services/ragService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const labData = req.body;
    
    // Validate required fields
    if (!labData.tds || !labData.ph || !labData.hardness || !labData.alkalinity) {
      return res.status(400).json({ 
        message: 'Missing required water parameters (tds, ph, hardness, alkalinity)' 
      });
    }

    // Analyze lab report using RAG service
    const analysis = await analyzeLabReport(labData);
    
    res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Lab report analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing lab report', 
      error: error.message 
    });
  }
}
