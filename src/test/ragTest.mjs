import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

async function testRAG() {
  const testCase = {
    waterData: {
      tds: 1500,
      ph: 7.2,
      hardness: 300,
      alkalinity: 250
    },
    requirements: {
      location: 'Coastal',
      useCase: 'Industrial',
      industry: 'Food',
      dailyDemand: 50
    }
  };

  try {
    console.log('Testing RAG system with sample data:', testCase);
    
    const prompt = `
    Based on this water analysis and requirements:
    Water Analysis:
    - TDS: ${testCase.waterData.tds} mg/L
    - pH: ${testCase.waterData.ph}
    - Hardness: ${testCase.waterData.hardness} mg/L
    - Alkalinity: ${testCase.waterData.alkalinity} mg/L

    Requirements:
    - Location: ${testCase.requirements.location}
    - Use Case: ${testCase.requirements.useCase}
    - Industry: ${testCase.requirements.industry}
    - Daily Demand: ${testCase.requirements.dailyDemand} m³/day

    Provide a detailed recommendation for:
    1. Pre-treatment system needed
    2. RO system specifications
    3. Post-treatment requirements
    4. Estimated system cost
    5. Maintenance schedule
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a water treatment expert specializing in RO system design. Provide practical, detailed recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    console.log('\nRAG Analysis Results:');
    console.log(completion.data.choices[0].message?.content);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRAG();
