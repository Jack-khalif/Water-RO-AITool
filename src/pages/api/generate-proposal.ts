import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { generateProposal } from '../../services/ragService';

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
    const { clientInfo, systemRequirements, labData } = req.body;
    
    // Validate required fields
    if (!clientInfo || !systemRequirements) {
      return res.status(400).json({ 
        message: 'Missing required fields (clientInfo, systemRequirements)' 
      });
    }

    // Generate proposal using RAG service
    const proposal = await generateProposal(clientInfo, systemRequirements, labData);
    
    res.status(200).json(proposal);
  } catch (error: any) {
    console.error('Proposal generation error:', error);
    res.status(500).json({ 
      message: 'Error generating proposal', 
      error: error.message 
    });
  }
}
