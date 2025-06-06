import { OpenAIApi, Configuration } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Sample knowledge base - In production, this would be stored in a vector database
const knowledgeBase = {
  waterUseCases: [
    { type: 'Industrial', factors: ['Flow rate', 'TDS levels', 'Specific contaminants', 'Process requirements'] },
    { type: 'Commercial', factors: ['Daily consumption', 'Peak hours', 'Space constraints', 'Budget'] },
    { type: 'Residential', factors: ['Family size', 'Water quality', 'Space available', 'Water pressure'] }
  ],
  locations: [
    { 
      region: 'Coastal',
      considerations: ['High TDS', 'Corrosion resistance', 'Higher maintenance'],
      priceAdjustment: 1.2
    },
    {
      region: 'Urban',
      considerations: ['Municipal water source', 'Space constraints', 'Noise regulations'],
      priceAdjustment: 1.0
    },
    {
      region: 'Rural',
      considerations: ['Well water', 'Power reliability', 'Service accessibility'],
      priceAdjustment: 1.1
    }
  ],
  systemTypes: [
    {
      name: 'Basic RO',
      capacity: '250-1000 LPH',
      features: ['Pre-filtration', 'RO membrane', 'Post-filtration'],
      applications: ['Drinking water', 'Light commercial']
    },
    {
      name: 'Industrial RO',
      capacity: '1000-5000 LPH',
      features: ['Dual-pass RO', 'Chemical dosing', 'Advanced monitoring'],
      applications: ['Process water', 'Manufacturing']
    }
  ]
};

interface WaterAnalysis {
  tds: number;
  ph: number;
  hardness: number;
  alkalinity: number;
  location: string;
  useCase: string;
  industry?: string;
  dailyDemand: number;
}

export async function analyzeRequirements(analysis: WaterAnalysis) {
  // Create a context-rich prompt for the AI
  const prompt = `
Based on the following water analysis and requirements:
- TDS: ${analysis.tds} mg/L
- pH: ${analysis.ph}
- Hardness: ${analysis.hardness} mg/L
- Alkalinity: ${analysis.alkalinity} mg/L
- Location: ${analysis.location}
- Use Case: ${analysis.useCase}
${analysis.industry ? `- Industry: ${analysis.industry}` : ''}
- Daily Demand: ${analysis.dailyDemand} m³/day

Provide recommendations in the following JSON format:
{
  "pretreatment": {
    "product": "string (e.g., DMI Filter)",
    "model": "string (e.g., DMI-25)",
    "description": "string"
  },
  "ro_system": {
    "model": "string (e.g., RO-250L)",
    "capacity": "string",
    "membrane_type": "string",
    "membrane_count": number,
    "antiscalant_type": "string"
  },
  "posttreatment": {
    "product": "string (e.g., UV Sterilizer)",
    "model": "string",
    "description": "string"
  },
  "maintenance_schedule": "string",
  "cost_estimate": "string",
  "explanation": "string (explain the choices in simple terms)"
}

Respond ONLY with a valid JSON object. Do not include any extra text. Consider local water conditions and industry-specific requirements.
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a water treatment expert specializing in RO system design. Use the knowledge base to provide accurate, practical recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const rawContent = completion.data.choices[0].message?.content || "";
    let recommendations;
    try {
      recommendations = JSON.parse(rawContent);
    } catch (e) {
      recommendations = { raw: rawContent, error: "LLM did not return valid JSON." };
    }
    return {
      recommendations,
      knowledgeBaseContext: getRelevantContext(analysis)
    };

  } catch (error) {
    console.error('RAG Service Error:', error);
    throw error;
  }
}

function getRelevantContext(analysis: WaterAnalysis) {
  // Extract relevant information from knowledge base based on the analysis
  const locationInfo = knowledgeBase.locations.find(
    loc => loc.region.toLowerCase() === analysis.location.toLowerCase()
  );

  const useCase = knowledgeBase.waterUseCases.find(
    use => use.type.toLowerCase() === analysis.useCase.toLowerCase()
  );

  const recommendedSystem = knowledgeBase.systemTypes.find(
    sys => analysis.dailyDemand <= parseInt(sys.capacity.split('-')[1])
  );

  return {
    locationConsiderations: locationInfo?.considerations || [],
    priceAdjustment: locationInfo?.priceAdjustment || 1.0,
    useCaseFactors: useCase?.factors || [],
    recommendedSystem: recommendedSystem
  };
}
