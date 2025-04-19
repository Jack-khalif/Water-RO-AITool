import { config } from 'dotenv';
import { WaterTreatmentAgent } from '../src/utils/agentWorkflow';
import { ProcessedDocument } from '../src/utils/pdfProcessor';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

async function testWorkflow() {
  try {
    // Read test water analysis
    const testFilePath = path.join(process.cwd(), 'reference_docs', 'test_water_analysis.txt');
    const testData = fs.readFileSync(testFilePath, 'utf-8');

    // Initialize agent
    const agent = new WaterTreatmentAgent(process.env.OPENAI_API_KEY || '');

    // Create a mock ProcessedDocument
    const mockDoc: ProcessedDocument = {
      text: testData,
      embeddings: [],
      metadata: [{
        source: testFilePath,
        page: 1,
        type: 'lab_report',
        isOCR: false,
        hasImage: false
      }]
    };

    // Execute workflow
    console.log('Starting workflow...');
    const result = await agent.executeWorkflow({ processedDocument: mockDoc });
    
    // Save results
    const outputPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('Workflow completed. Results saved to test-results.json');
    console.log('\nWorkflow State:', result.status);
    console.log('Current Step:', result.currentStep);
    console.log('Progress:', result.progress + '%');
    
  } catch (error) {
    console.error('Workflow failed:', error);
  }
}

testWorkflow();
