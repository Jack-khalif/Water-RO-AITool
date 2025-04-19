import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeRequirements } from '../../services/ragService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const analysis = req.body;
    const recommendations = await analyzeRequirements(analysis);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Analysis API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
