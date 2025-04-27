from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

app = FastAPI()

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import sys
sys.path.append('.')  # So we can import query_rag
from query_rag import generate_answer, query_index, enrich_recommendation_with_erp

@app.post("/api/generate-proposal")
async def generate_proposal(
    pdf: UploadFile = File(...),
    query: str = Form(...)
) -> Dict[str, Any]:
    # 1. Parse PDF (stub: just use dummy lab report for now)
    # In production, parse the PDF and extract lab_report_json
    # pdf_content = await pdf.read()
    lab_report_json = '{"hardness": 200, "turbidity": 7, "TDS": 1200, "location": "Matungulu", "source": "borehole"}'
    # 2. Run RAG pipeline
    context_chunks = query_index(query, k=3)
    recommendation, markdown_summary, _ = generate_answer(query, context_chunks)
    # 3. Enrich with ERP
    enriched = enrich_recommendation_with_erp(recommendation)
    # 4. Return
    return {
        "products": [
            {**prod, "quantity": 1} for section in [enriched['pretreatment'], enriched['RO'], enriched['postreatment']] for prod in section
        ],
        "summary": markdown_summary
    }

@app.get("/api/search-product")
def search_product(q: str) -> List[Dict[str, Any]]:
    # Query ERP for products matching q (stub: return dummy, real logic can reuse ERP search)
    return [
        {
            "product_name": "Spare Filter",
            "model_number": "SF-100",
            "description": "Spare filter for maintenance",
            "unit_price": 50,
        }
    ]

@app.get("/api/search-product")
def search_product(q: str) -> List[Dict[str, Any]]:
    # Query ERP for products matching q (stub)
    return [
        {
            "product_name": "Spare Filter",
            "model_number": "SF-100",
            "description": "Spare filter for maintenance",
            "unit_price": 50,
        }
    ]
