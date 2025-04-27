"""
Frontend Integration API for Water Treatment RAG System

This module provides FastAPI endpoints that integrate with the Davis & Shirtliff frontend.
"""

import os
import json
from typing import Dict, Optional, Any, List
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import markdown

# Import RAG processing functionality
from query_rag import (
    extract_lab_report_from_pdf,
    convert_lab_report_to_json,
    process_lab_report_and_query
)

# FastAPI app
app = FastAPI(
    title="D&S Frontend Integration API",
    description="API for water treatment system recommendations"
)

# CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy cart state for demo purposes (would be a database in production)
CART_STATE = {
    "sections": [
        {
            "label": "Pretreatment",
            "products": []
        },
        {
            "label": "RO System",
            "products": []
        },
        {
            "label": "Posttreatment",
            "products": []
        }
    ],
    "summary_html": "",
    "rationale_html": ""
}

# Input models
class LLMRecommendation(BaseModel):
    cart: Dict[str, List[Dict[str, Any]]]
    explanation: str

# API endpoints that match what the frontend expects
@app.post("/api/analyze")
async def analyze_lab_report(
    report: UploadFile = File(...),
    query: str = Form(...)
):
    """
    Analyze uploaded lab report and user query using RAG system
    """
    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{report.filename}"
        with open(temp_path, "wb") as buffer:
            content = await report.read()
            buffer.write(content)
        
        # Extract text from PDF
        lab_report_text = extract_lab_report_from_pdf(temp_path)
        if not lab_report_text:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the lab report"
            )
        
        # Convert text to JSON
        lab_json = convert_lab_report_to_json(lab_report_text)
        if not lab_json:
            raise HTTPException(
                status_code=400, 
                detail="Could not convert lab report to JSON format"
            )
        
        # Process with RAG
        result = process_lab_report_and_query(lab_json, query)
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Return result in format frontend expects
        return {"recommendation": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cart/populate_from_llm")
async def populate_cart_from_llm(recommendation: LLMRecommendation):
    """
    Populate cart with LLM-generated recommendations
    """
    try:
        # Map RAG results to cart sections
        cart_sections = CART_STATE["sections"]
        
        # Clear existing products
        for section in cart_sections:
            section["products"] = []
        
        # Add pretreatment products
        for product in recommendation.cart["pretreatment"]:
            cart_sections[0]["products"].append({
                "product_name": product["product_name"],
                "model_number": product["model_number"],
                "description": product["product_description"],
                "unit_price": product.get("unit_price", 0),
                "quantity": 1
            })
        
        # Add RO products
        for product in recommendation.cart["RO"]:
            cart_sections[1]["products"].append({
                "product_name": product["product_name"],
                "model_number": product["model_number"],
                "description": product["product_description"],
                "unit_price": product.get("unit_price", 0),
                "quantity": 1
            })
        
        # Add posttreatment products
        for product in recommendation.cart["postreatment"]:
            cart_sections[2]["products"].append({
                "product_name": product["product_name"],
                "model_number": product["model_number"],
                "description": product["product_description"],
                "unit_price": product.get("unit_price", 0),
                "quantity": 1
            })
        
        # Convert markdown explanation to HTML for summary section
        html_content = markdown.markdown(recommendation.explanation)
        
        # Split explanation into summary and rationale
        parts = html_content.split("<h2>", 1)
        if len(parts) > 1:
            summary_part = parts[0]
            rationale_part = "<h2>" + parts[1]
        else:
            summary_part = html_content
            rationale_part = ""
        
        # Update summary HTML
        CART_STATE["summary_html"] = summary_part
        CART_STATE["rationale_html"] = rationale_part
        
        return {"success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart")
async def get_cart():
    """
    Get current cart state
    """
    return {"sections": CART_STATE["sections"]}

@app.get("/api/cart/summary")
async def get_cart_summary():
    """
    Get cart summary and rationale HTML
    """
    return {
        "summary_html": CART_STATE["summary_html"],
        "rationale_html": CART_STATE["rationale_html"]
    }

@app.post("/api/cart/add")
async def add_to_cart(data: Dict[str, Any]):
    """
    Add product to cart
    """
    section_label = data.get("section_label")
    product = data.get("product")
    
    # Find the section
    for section in CART_STATE["sections"]:
        if section["label"] == section_label:
            # Check if product already exists
            exists = False
            for existing in section["products"]:
                if existing["model_number"] == product["model_number"]:
                    existing["quantity"] += 1
                    exists = True
                    break
            
            # Add new product if it doesn't exist
            if not exists:
                section["products"].append(product)
            break
    
    return {"success": True}

@app.post("/api/cart/remove")
async def remove_from_cart(data: Dict[str, Any]):
    """
    Remove product from cart
    """
    section_label = data.get("section_label")
    model_number = data.get("model_number")
    
    # Find the section
    for section in CART_STATE["sections"]:
        if section["label"] == section_label:
            # Remove product
            section["products"] = [
                p for p in section["products"] 
                if p["model_number"] != model_number
            ]
            break
    
    return {"success": True}

@app.post("/api/cart/update_quantity")
async def update_quantity(data: Dict[str, Any]):
    """
    Update product quantity
    """
    section_label = data.get("section_label")
    model_number = data.get("model_number")
    quantity = int(data.get("quantity", 1))
    
    # Find the section
    for section in CART_STATE["sections"]:
        if section["label"] == section_label:
            # Update quantity
            for product in section["products"]:
                if product["model_number"] == model_number:
                    product["quantity"] = quantity
                    break
            break
    
    return {"success": True}

@app.get("/api/products/search")
async def search_products(query: str):
    """
    Search products
    """
    # For demo purposes, just return some dummy search results
    # In a real implementation, this would search a product database
    results = [
        {
            "product_name": "Multimedia Filter",
            "model_number": "MMF-500",
            "description": "Multimedia filtration system for sediment removal",
            "unit_price": 1200
        },
        {
            "product_name": "DMI Filter",
            "model_number": "DMI-300",
            "description": "Iron and manganese removal filter",
            "unit_price": 1500
        },
        {
            "product_name": "RO Membrane 4040",
            "model_number": "RO-4040",
            "description": "High rejection TFC membrane",
            "unit_price": 450
        }
    ]
    
    filtered = [r for r in results if query.lower() in r["product_name"].lower()]
    return {"results": filtered}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("frontend_integration:app", host="0.0.0.0", port=8080, reload=True)
