"""
Water Treatment Analysis and RO System Design API

This module provides a FastAPI interface to the water treatment agent workflow.
"""

import os
import shutil
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Body, Depends, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import json
import uvicorn
from pathlib import Path

# Import the water treatment agent
from water_treatment_agent import (
    run_water_treatment_agent, 
    WaterParameters, 
    PretreatmentRecommendation, 
    ROSystemSpec, 
    CostEstimate, 
    Proposal
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# FastAPI app
app = FastAPI(title="HydroFlow Water Treatment Agent API", 
              description="API for water treatment analysis and RO system design")

# CORS middleware to allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Pydantic models for request/response validation
class LabReportRequest(BaseModel):
    lab_report: Optional[str] = Field(None, description="The water analysis lab report text")
    user_requirements: Dict[str, Any] = Field(..., description="User requirements including flow rate, application, etc.")
    generate_multiple_designs: bool = Field(True, description="Whether to generate multiple design options")
    image_path: Optional[str] = Field(None, description="Path to the uploaded lab report image if any")

# Authentication middleware
async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    
    # In a real application, you would validate the token here
    # For now, we'll just check if it exists
    token = auth_header.replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    return token

# API endpoint for uploading lab report image
@app.post("/upload-report")
async def upload_report(file: UploadFile = File(...), token: str = Depends(verify_token)):
    try:
        # Generate a unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"lab_report_{os.urandom(8).hex()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the path to the saved file
        return {
            "message": "File uploaded successfully",
            "file_path": str(file_path),
            "url": f"/uploads/{unique_filename}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API endpoint for water treatment analysis with text or image input
@app.post("/analyze")
async def analyze_water(
    request: LabReportRequest,
    token: str = Depends(verify_token)
):
    try:
        # Validate input - either lab_report or image_path must be provided
        if not request.lab_report and not request.image_path:
            raise HTTPException(
                status_code=400, 
                detail="Either lab_report text or image_path must be provided"
            )
        
        # Run the water treatment agent
        design_proposals = run_water_treatment_agent(
            lab_report=request.lab_report,
            lab_report_image=request.image_path,
            user_requirements=request.user_requirements
        )
        
        return design_proposals
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Run the server
if __name__ == "__main__":
    uvicorn.run("water_treatment_api:app", host="0.0.0.0", port=8000, reload=True)
