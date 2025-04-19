import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { generateQuotation } from '../../services/quotationService';

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
    const quotationRequest = req.body;
    
    // Validate required fields
    if (!quotationRequest.waterAnalysis || !quotationRequest.systemRequirements || !quotationRequest.clientInfo) {
      return res.status(400).json({ 
        message: 'Missing required fields (waterAnalysis, systemRequirements, clientInfo)' 
      });
    }

    // Generate quotation using RAG service
    const quotation = await generateQuotation(quotationRequest);
    
    res.status(200).json(quotation);
  } catch (error: any) {
    console.error('Quotation generation error:', error);
    res.status(500).json({ 
      message: 'Error generating quotation', 
      error: error.message 
    });
  }
}
