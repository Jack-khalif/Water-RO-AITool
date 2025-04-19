import { initializeKnowledgeBase } from '../src/utils/initializeKnowledgeBase';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting base knowledge initialization...');
    
    const result = await initializeKnowledgeBase({
      baseDirectory: path.join(process.cwd(), 'reference_docs'),
      vectorStoreDirectory: path.join(process.cwd(), 'vectors'),
      openAIApiKey: process.env.OPENAI_API_KEY!
    });

    console.log('✅ Base knowledge initialization complete!');
    console.log(`📚 Processed ${result.documentCount} documents`);
    console.log(`🧩 Created ${result.chunkCount} chunks`);
    console.log(`💾 Vector store saved at: ${result.vectorStorePath}`);

  } catch (error) {
    console.error('❌ Error initializing base knowledge:', error);
    process.exit(1);
  }
}

main();
