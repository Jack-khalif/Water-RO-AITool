import type { NextApiRequest, NextApiResponse } from 'next';
import { getAIResponse } from '../../utils/openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    const response = await getAIResponse(message);
    res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
