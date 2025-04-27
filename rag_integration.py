"""
RAG Integration API for water treatment system recommendations

This module provides FastAPI endpoints that integrate the RAG agent with the 
frontend workflow for water lab report analysis and product recommendations.
"""

import os
import json
from typing import Dict, Optional, Any, List
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import RAG processing functionality
from query_rag import (
    extract_lab_report_from_pdf,
    convert_lab_report_to_json,
    process_lab_report_and_query
)

# FastAPI app
app = FastAPI(
    title="HydroFlow RAG Integration API",
    description="API for water treatment RAG processing and product recommendations"
)

# CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class LabReportRequest(BaseModel):
    lab_report_json: Dict[str, Any] = Field(
        ..., 
        description="The water analysis lab report in JSON format"
    )
    user_query: str = Field(
        ..., 
        description="User's query about desired water treatment system"
    )

class RecommendationResponse(BaseModel):
    cart: Dict[str, List[Dict[str, Any]]] = Field(
        ..., 
        description="Products for cart, organized by treatment stage with ERP data"
    )
    explanation: str = Field(
        ..., 
        description="Markdown explanation of the recommendations"
    )

@app.post("/process_lab_report", response_model=RecommendationResponse)
async def process_lab_report_endpoint(request: LabReportRequest):
    """
    Process a lab report JSON and user query to generate product recommendations.
    """
    try:
        # Convert lab report dict to JSON string
        lab_json = json.dumps(request.lab_report_json)
        
        # Process the lab report and query
        result = process_lab_report_and_query(lab_json, request.user_query)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_lab_report")
async def upload_lab_report_endpoint(
    file: UploadFile = File(...),
    user_query: str = Form(...)
):
    """
    Upload a lab report PDF file and process it with a user query.
    """
    try:
        # Save the uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text from PDF
        lab_report_text = extract_lab_report_from_pdf(temp_path)
        if not lab_report_text:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the lab report PDF"
            )
        
        # Convert text to JSON
        lab_json = convert_lab_report_to_json(lab_report_text)
        if not lab_json:
            raise HTTPException(
                status_code=400, 
                detail="Could not convert lab report to JSON format"
            )
        
        # Process the lab report and query
        result = process_lab_report_and_query(lab_json, user_query)
        
        # Clean up the temp file
        os.remove(temp_path)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_integration:app", host="0.0.0.0", port=8001, reload=True)
