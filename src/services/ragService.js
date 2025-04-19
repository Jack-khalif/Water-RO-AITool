/**
 * RAG Service - Client for the Python FastAPI RAG server
 * Handles communication between the Next.js app and the RAG system
 */

async function queryRagSystem(query, options = {}) {
  try {
    const { topK = 3, useCase, waterParams } = options;
    
    const response = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: topK,
        use_case: useCase,
        water_params: waterParams,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to query RAG system');
    }

    return await response.json();
  } catch (error) {
    console.error('RAG Service Error:', error);
    throw error;
  }
}

async function analyzeLabReport(labData) {
  try {
    // Extract key water parameters from lab report
    const waterParams = {
      tds: labData.tds,
      ph: labData.ph,
      hardness: labData.hardness,
      alkalinity: labData.alkalinity,
      chlorides: labData.chlorides || 0,
    };

    // Generate analysis query
    const query = `Based on a water analysis with TDS ${labData.tds} mg/L, 
      pH ${labData.ph}, hardness ${labData.hardness} mg/L, and 
      alkalinity ${labData.alkalinity} mg/L, what RO system is recommended?`;

    // Query the RAG system with water parameters as context
    return await queryRagSystem(query, {
      topK: 5,
      useCase: labData.useCase || 'General',
      waterParams,
    });
  } catch (error) {
    console.error('Lab Report Analysis Error:', error);
    throw error;
  }
}

async function generateProposal(clientInfo, systemRequirements, labData) {
  try {
    // Combine client info and system requirements into a query
    const query = `Generate a proposal for a ${systemRequirements.capacity} LPH RO system 
      for ${clientInfo.industry || 'general use'} in ${clientInfo.location}.`;

    // Query the RAG system with all available context
    return await queryRagSystem(query, {
      topK: 5,
      useCase: clientInfo.industry,
      waterParams: labData,
    });
  } catch (error) {
    console.error('Proposal Generation Error:', error);
    throw error;
  }
}

async function askEngineerQuestion(question, context = {}) {
  try {
    return await queryRagSystem(question, {
      topK: 3,
      useCase: context.useCase,
      waterParams: context.waterParams,
    });
  } catch (error) {
    console.error('Engineer Question Error:', error);
    throw error;
  }
}

export { queryRagSystem, analyzeLabReport, generateProposal, askEngineerQuestion };
