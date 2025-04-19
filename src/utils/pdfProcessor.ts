import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf-img-convert';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ProcessedDocument {
  text: string;
  embeddings: number[][];
  metadata: Array<{
    source: string;
    page: number;
    isOCR?: boolean;
    hasImage?: boolean;
    imageConfidence?: number;
    type: 'lab_report' | 'reference';
  }>;
}

interface OCRResult {
  text: string;
  confidence: number;
}

async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  // Pre-process image for better OCR
  const processedImagePath = imagePath + '_processed.png';
  await sharp(imagePath)
    .greyscale() // Convert to grayscale
    .normalize() // Normalize contrast
    .modulate({ brightness: 1.2 }) // Increase brightness slightly
    .sharpen() // Sharpen the image
    .threshold(128) // Binary threshold
    .toFile(processedImagePath);

  // Perform OCR
  const { data } = await worker.recognize(processedImagePath);
  await worker.terminate();

  // Clean up temporary file
  fs.unlinkSync(processedImagePath);

  return {
    text: data.text,
    confidence: data.confidence
  };
}

async function convertPDFPageToImage(pdfPath: string, pageNum: number): Promise<string> {
  // Convert PDF pages to images
  const pdfArray = await fromPath(pdfPath);
  
  // Check if the requested page exists
  if (pageNum >= pdfArray.length) {
    throw new Error(`Page ${pageNum} does not exist in the PDF`);
  }

  // Get the image data for the specific page
  const imageBuffer = pdfArray[pageNum];
  
  // Save the image to a temporary file
  const tempImagePath = path.join(process.cwd(), 'temp', `page_${pageNum}.png`);
  await fs.promises.writeFile(tempImagePath, new Uint8Array(imageBuffer));

  // Enhance image quality using sharp
  await sharp(tempImagePath)
    .normalize() // Normalize the image contrast
    .sharpen() // Sharpen the image
    .png({
      quality: 100,
      force: true,
      compressionLevel: 9 // Best compression
    })
    .toFile(tempImagePath + '_enhanced.png');

  // Remove the original temp file
  await fs.promises.unlink(tempImagePath);

  return tempImagePath + '_enhanced.png';
}

export async function processPDF(filePath: string): Promise<ProcessedDocument> {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Process the lab report
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    // Enhance with OCR if needed
    const enhancedDocs = await Promise.all(
      docs.map(async (doc, pageNum) => {
        if (doc.pageContent.trim().length < 100) {
          const imagePath = await convertPDFPageToImage(filePath, pageNum);
          const { text: ocrText, confidence } = await extractTextFromImage(imagePath);
          fs.unlinkSync(imagePath);

          return {
            ...doc,
            pageContent: ocrText,
            metadata: { 
              ...doc.metadata, 
              isOCR: true, 
              type: 'lab_report',
              hasImage: true,
              imageConfidence: confidence
            }
          };
        }
        return {
          ...doc,
          metadata: { ...doc.metadata, type: 'lab_report' }
        };
      })
    );

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(enhancedDocs);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    // Load the base knowledge vector store
    const baseKnowledgePath = path.join(process.cwd(), 'vectors', 'base_knowledge');
    let vectorStore: FaissStore;
    
    if (fs.existsSync(baseKnowledgePath)) {
      // Load existing base knowledge and add new documents
      vectorStore = await FaissStore.load(baseKnowledgePath, embeddings);
      await vectorStore.addDocuments(splitDocs);
    } else {
      // If no base knowledge exists, create new store with just the lab report
      vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    }

    // Save the updated vector store
    await vectorStore.save(baseKnowledgePath);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      text: enhancedDocs.map(doc => doc.pageContent).join("\n"),
      embeddings: await embeddings.embedDocuments(splitDocs.map(doc => doc.pageContent)),
      metadata: splitDocs.map(doc => ({
        source: doc.metadata.source || "",
        page: doc.metadata.page || 0,
        isOCR: doc.metadata.isOCR || false,
        type: 'lab_report'
      }))
    };

  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
}
