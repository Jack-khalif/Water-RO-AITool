import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import path from 'path';
import fs from 'fs';

export interface KnowledgeBaseConfig {
  baseDirectory: string;  // Directory containing reference documents
  vectorStoreDirectory: string;  // Where to save the vector store
  openAIApiKey: string;
}

export async function initializeKnowledgeBase(config: KnowledgeBaseConfig) {
  try {
    console.log("Starting knowledge base initialization...");
    
    // Create vector store directory if it doesn't exist
    if (!fs.existsSync(config.vectorStoreDirectory)) {
      fs.mkdirSync(config.vectorStoreDirectory, { recursive: true });
    }

    // Get all PDF files from the base directory
    const files = fs.readdirSync(config.baseDirectory)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(config.baseDirectory, file));

    console.log(`Found ${files.length} PDF files to process`);

    // Process each PDF
    const allDocs = [];
    for (const file of files) {
      console.log(`Processing ${path.basename(file)}...`);
      const loader = new PDFLoader(file);
      const docs = await loader.load();
      allDocs.push(...docs);
    }

    // Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(allDocs);

    console.log(`Created ${splitDocs.length} document chunks`);

    // Create embeddings and store in FAISS
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openAIApiKey,
    });

    console.log("Creating vector store...");
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    
    // Save the vector store
    const storePath = path.join(config.vectorStoreDirectory, 'base_knowledge');
    await vectorStore.save(storePath);

    console.log("Knowledge base initialization complete!");
    return {
      documentCount: files.length,
      chunkCount: splitDocs.length,
      vectorStorePath: storePath
    };

  } catch (error) {
    console.error("Error initializing knowledge base:", error);
    throw error;
  }
}
