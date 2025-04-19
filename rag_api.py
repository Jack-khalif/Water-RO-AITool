import os
import csv
import faiss
import numpy as np
import openai
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

INDEX_FILE = "rag_faiss.index"
MAPPING_FILE = "rag_mapping.csv"
EMBED_MODEL = "text-embedding-ada-002"

# FastAPI app
app = FastAPI(title="HydroFlow RAG API", description="API for water treatment knowledge retrieval")

# CORS middleware to allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's question about water treatment")
    top_k: int = Field(3, description="Number of relevant chunks to retrieve")
    use_case: Optional[str] = Field(None, description="Optional use case context")
    water_params: Optional[Dict[str, Any]] = Field(None, description="Optional water parameters")

class ChunkInfo(BaseModel):
    content: str
    source: str
    relevance: float

class QueryResponse(BaseModel):
    answer: str
    relevant_chunks: List[ChunkInfo]
    sources: List[str]

# Load mapping file
def load_mapping():
    chunks = []
    sources = []
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            chunks.append(row[0])
            sources.append(row[1])
    return chunks, sources

# Get embedding for query
def get_embedding(text):
    response = openai.embeddings.create(input=[text], model=EMBED_MODEL)
    return np.array(response.data[0].embedding, dtype=np.float32).reshape(1, -1)

# Search index for similar chunks
def search_index(query_embedding, k=3):
    index = faiss.read_index(INDEX_FILE)
    distances, indices = index.search(query_embedding, k)
    return distances, indices

# Generate answer using retrieved context
def generate_answer(query, context_chunks, use_case=None, water_params=None):
    # Combine context chunks
    context = "\n\n---\n\n".join([c.content for c in context_chunks])
    
    # Add use case and water parameters if provided
    additional_context = ""
    if use_case:
        additional_context += f"\n\nUse case: {use_case}"
    
    if water_params:
        additional_context += "\n\nWater parameters:\n"
        for key, value in water_params.items():
            additional_context += f"- {key}: {value}\n"
    
    # Create prompt
    prompt = f"""Based on the following information from water treatment documentation, please answer the question.

Question: {query}

Relevant Information:
{context}
{additional_context}

Answer the question using only the information provided above. If you cannot answer based on the provided information, say so."""
    
    # Generate answer
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a water treatment expert specializing in reverse osmosis systems. Answer questions based only on the provided context."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )
    
    return response.choices[0].message.content

# API endpoint for querying
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
        # Get query embedding
        query_embedding = get_embedding(request.query)
        
        # Search index
        distances, indices = search_index(query_embedding, request.top_k)
        
        # Load mapping
        chunks, sources = load_mapping()
        
        # Prepare results
        results = []
        unique_sources = set()
        
        for i, idx in enumerate(indices[0]):
            if idx != -1:  # -1 means no result
                chunk_info = ChunkInfo(
                    content=chunks[idx],
                    source=sources[idx],
                    relevance=float(1.0 - distances[0][i])  # Convert distance to relevance score
                )
                results.append(chunk_info)
                unique_sources.add(sources[idx])
        
        # Generate answer
        answer = generate_answer(
            request.query, 
            results, 
            request.use_case, 
            request.water_params
        )
        
        return QueryResponse(
            answer=answer,
            relevant_chunks=results,
            sources=list(unique_sources)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Run the server
if __name__ == "__main__":
    uvicorn.run("rag_api:app", host="0.0.0.0", port=8000, reload=True)
