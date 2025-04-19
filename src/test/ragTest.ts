import { analyzeRequirements } from '../services/ragService';

async function testRAG() {
  const testCase = {
    tds: 1500,
    ph: 7.2,
    hardness: 300,
    alkalinity: 250,
    location: 'Coastal',
    useCase: 'Industrial',
    industry: 'Food',
    dailyDemand: 50
  };

  try {
    console.log('Testing RAG system with sample data:', testCase);
    const result = await analyzeRequirements(testCase);
    console.log('\nRAG Analysis Results:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRAG();
