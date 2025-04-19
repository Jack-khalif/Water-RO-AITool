import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Assuming you're using NextAuth

type AnalyzeRequest = {
  lab_report: string;
  user_requirements: {
    flow_rate: number;
    application: string;
    budget_constraint: string;
    space_constraint: string;
    power_availability: string;
    target_tds: number;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get request data
    const { lab_report, user_requirements } = req.body as AnalyzeRequest;

    // In a production environment, this would call your Python backend
    // For now, we'll forward the request to the water treatment API
    const apiUrl = process.env.WATER_TREATMENT_API_URL || 'http://localhost:8000/analyze';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN || 'dev-token'}`,
      },
      body: JSON.stringify({
        lab_report,
        user_requirements,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in water treatment analysis:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
