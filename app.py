from dotenv import load_dotenv
load_dotenv('.env.local')
import os

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Optional
import shutil
import os
import pdfplumber
from generate_proposal import render_proposal
from query_rag import query_index, generate_answer, enrich_recommendation_with_erp, Recommendation
import tempfile
import pdfplumber
import json
import tempfile
import re
import logging
# === DB imports ===
from database import SessionLocal, LabReport, Recommendation, Proposal
from fastapi import Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from query_rag import enrich_recommendation_with_erp

import os
TEMPLATES_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=TEMPLATES_DIR)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/lab-reports")
def list_lab_reports(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    List all lab reports (paginated).
    """
    reports = db.query(LabReport).order_by(LabReport.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "client_name": r.client_name,
            "sample_id": r.sample_id,
            "report_date": r.report_date,
            "created_at": r.created_at,
        }
        for r in reports
    ]

@app.get("/lab-reports/{lab_report_id}")
def get_lab_report(lab_report_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific lab report and its extracted features.
    """
    report = db.query(LabReport).filter(LabReport.id == lab_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return {
        "id": report.id,
        "client_name": report.client_name,
        "sample_id": report.sample_id,
        "report_date": report.report_date,
        "features": report.features_json,
        "created_at": report.created_at,
    }

# === LLM Recommendation Endpoints ===
from fastapi import Body

@app.post("/lab-reports/{lab_report_id}/recommendation")
def store_recommendation(lab_report_id: int, query: str = Body(...), llm_json: dict = Body(...), db: Session = Depends(get_db)):
    """
    Store an LLM recommendation JSON for a given lab report.
    """
    lab_report = db.query(LabReport).filter(LabReport.id == lab_report_id).first()
    if not lab_report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    rec = Recommendation(lab_report_id=lab_report_id, query=query, llm_json=llm_json)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"recommendation_id": rec.id, "lab_report_id": lab_report_id, "llm_json": llm_json}

@app.get("/lab-reports/{lab_report_id}/recommendation")
def get_recommendation(lab_report_id: int, db: Session = Depends(get_db)):
    """
    Retrieve the latest LLM recommendation for a given lab report.
    """
    rec = db.query(Recommendation).filter(Recommendation.lab_report_id == lab_report_id).order_by(Recommendation.created_at.desc()).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found for this lab report")
    return {
        "recommendation_id": rec.id,
        "lab_report_id": rec.lab_report_id,
        "query": rec.query,
        "llm_json": rec.llm_json,
        "enriched_json": rec.enriched_json,
        "created_at": rec.created_at,
    }

# === Enrich Recommendation Endpoint ===
@app.post("/lab-reports/{lab_report_id}/recommendation/{recommendation_id}/enrich")
def enrich_recommendation(lab_report_id: int, recommendation_id: int, db: Session = Depends(get_db)):
    """
    Enrich a recommendation with ERP data (pricing/specs) and store in the DB.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id, Recommendation.lab_report_id == lab_report_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    # Use the existing enrich_recommendation_with_erp utility
    enriched = enrich_recommendation_with_erp(Recommendation.model_validate(rec.llm_json))
    rec.enriched_json = enriched
    db.commit()
    db.refresh(rec)
    return {
        "recommendation_id": rec.id,
        "lab_report_id": rec.lab_report_id,
        "enriched_json": rec.enriched_json,
        "created_at": rec.created_at,
    }

# === Proposal Preview Endpoint ===
@app.get("/proposal/preview", response_class=HTMLResponse)
def proposal_preview(request: Request, db: Session = Depends(get_db)):
    """
    Display the proposal_template.html as the last page of the proposal process, using cart items and the latest LLM summary/rationale for dynamic preview.
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == 'default').all()
    # Group by section for display
    sections = {}
    for item in cart_items:
        if item.section not in sections:
            sections[item.section] = []
        sections[item.section].append({
            "model_number": item.model_number,
            "product_name": item.product_name,
            "quantity": item.quantity,
            # TODO: Add pricing from ERP if available
            "unit_price": 100,  # Placeholder
            "total_price": 100 * item.quantity
        })
    total = sum(i["total_price"] for s in sections.values() for i in s)

    # Fetch latest LLM recommendation (for now, just get the most recent one)
    rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()
    llm_summary = ""
    llm_rationale = ""
    if rec and rec.llm_json:
        llm_summary = rec.llm_json.get("summary", "")
        llm_rationale = rec.llm_json.get("rationale", "")

    return templates.TemplateResponse(
        "proposal_template.html",
        {
            "request": request,
            "cart_sections": sections,
            "cart_total": total,
            "llm_summary": llm_summary,
            "llm_rationale": llm_rationale,
        }
    )

# === Proposal Storage/Retrieval Endpoints ===
from fastapi import Body

@app.post("/lab-reports/{lab_report_id}/recommendation/{recommendation_id}/proposal")
def store_proposal(lab_report_id: int, recommendation_id: int, proposal_path: str = Body(...), db: Session = Depends(get_db)):
    """
    Store a generated proposal path, linked to a recommendation.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id, Recommendation.lab_report_id == lab_report_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    proposal = Proposal(recommendation_id=recommendation_id, proposal_path=proposal_path)
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return {
        "proposal_id": proposal.id,
        "recommendation_id": recommendation_id,
        "proposal_path": proposal.proposal_path,
        "created_at": proposal.created_at,
    }

@app.get("/proposals/{proposal_id}")
def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a proposal by its ID.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return {
        "proposal_id": proposal.id,
        "recommendation_id": proposal.recommendation_id,
        "proposal_path": proposal.proposal_path,
        "created_at": proposal.created_at,
    }

# === Cart CRUD Endpoints (DB-backed) ===
from database import CartItem

@app.get("/api/cart")
def get_cart(db: Session = Depends(get_db)):
    """Get all cart items, grouped by section."""
    items = db.query(CartItem).filter(CartItem.user_id == 'default').all()
    sections = {}
    for item in items:
        if item.section not in sections:
            sections[item.section] = []
        sections[item.section].append({
            "id": item.id,
            "model_number": item.model_number,
            "product_name": item.product_name,
            "quantity": item.quantity,
        })
    return {"sections": sections}

@app.post("/api/cart/add")
def add_product(section: str = Body(...), model_number: str = Body(...), product_name: str = Body(...), quantity: int = Body(1), db: Session = Depends(get_db)):
    """Add a product to the cart (or update quantity if exists)."""
    existing = db.query(CartItem).filter_by(user_id='default', section=section, model_number=model_number).first()
    if existing:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return {"message": "Quantity updated", "item": {"id": existing.id, "model_number": existing.model_number, "product_name": existing.product_name, "quantity": existing.quantity}}
    item = CartItem(section=section, model_number=model_number, product_name=product_name, quantity=quantity, user_id='default')
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Product added", "item": {"id": item.id, "model_number": item.model_number, "product_name": item.product_name, "quantity": item.quantity}}

@app.post("/api/cart/remove")
def remove_product(item_id: int = Body(...), db: Session = Depends(get_db)):
    """Remove a product from the cart by item ID."""
    item = db.query(CartItem).filter_by(user_id='default', id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"message": "Product removed"}

@app.post("/api/cart/update_quantity")
def update_quantity(item_id: int = Body(...), quantity: int = Body(...), db: Session = Depends(get_db)):
    """Update the quantity of a cart item."""
    item = db.query(CartItem).filter_by(user_id='default', id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return {"message": "Quantity updated", "item": {"id": item.id, "model_number": item.model_number, "product_name": item.product_name, "quantity": item.quantity}}

@app.post("/api/cart/clear")
def clear_cart(db: Session = Depends(get_db)):
    """Remove all items from the cart."""
    db.query(CartItem).filter_by(user_id='default').delete()
    db.commit()
    return {"message": "Cart cleared"}

@app.get("/api/cart/preview")
def get_cart_preview(db: Session = Depends(get_db)):
    """Preview the cart with totals."""
    items = db.query(CartItem).filter(CartItem.user_id == 'default').all()
    total = 0
    item_list = []
    for item in items:
        # In real use, price should come from ERP, here we set dummy price
        unit_price = 100  # TODO: fetch from ERP
        total_price = unit_price * item.quantity
        total += total_price
        item_list.append({
            "name": item.product_name,
            "model": item.model_number,
            "unit_price": unit_price,
            "quantity": item.quantity,
            "total_price": total_price
        })
    return {"items": item_list, "total": total}

@app.get("/api/products/search")
def search_products(query: str):
    # Simple substring search for demo
    results = [p for p in ERP_PRODUCTS if query.lower() in p["product_name"].lower() or query.lower() in p["model_number"].lower()]
    return {"results": results}

@app.post("/api/analyze")
async def analyze_api(report: UploadFile = File(...), query: str = Form(...)):
    """
    Accepts lab report PDF and a query, extracts features, and generates an LLM recommendation using both.
    """
    import re
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        tmp_path = tmp.name
        await report.seek(0)
        content = await report.read()
        tmp.write(content)
    # Extract features from PDF
    features = {}
    try:
        with pdfplumber.open(tmp_path) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            features['raw_text'] = text
            def extract_val(label, unit=None, default=None, regex=None):
                if regex:
                    match = re.search(regex, text, re.IGNORECASE)
                else:
                    match = re.search(fr"{label}\s*[:=]?\s*([\d\.]+)\s*{unit if unit else ''}", text, re.IGNORECASE)
                return float(match.group(1)) if match else default
            features.update({
                "tds": extract_val("TDS", "mg/L"),
                "ph": extract_val("pH"),
                "hardness": extract_val("Hardness", "mg/L"),
                "alkalinity": extract_val("Alkalinity", "mg/L"),
                "calcium": extract_val("Calcium", "mg/L"),
                "magnesium": extract_val("Magnesium", "mg/L"),
                "sodium": extract_val("Sodium", "mg/L"),
                "chloride": extract_val("Chloride", "mg/L"),
                "sulphate": extract_val("Sulphate", "mg/L"),
                "iron": extract_val("Iron", "mg/L"),
                "manganese": extract_val("Manganese", "mg/L"),
                "nitrate": extract_val("Nitrate", "mg/L"),
                "fluoride": extract_val("Fluoride", "mg/L"),
                "color": extract_val("Color"),
                "turbidity": extract_val("Turbidity", "NTU"),
                "e_coli": extract_val("E.coli"),
            })
    except Exception:
        features['raw_text'] = ''
    # Compose prompt: user query + extracted water analysis
    water_analysis = "\n".join([
        f"    - TDS: {features.get('tds', 'N/A')} mg/L",
        f"    - pH: {features.get('ph', 'N/A')}",
        f"    - Hardness: {features.get('hardness', 'N/A')} mg/L",
        f"    - Alkalinity: {features.get('alkalinity', 'N/A')} mg/L",
        f"    - Calcium: {features.get('calcium', 'N/A')} mg/L",
        f"    - Magnesium: {features.get('magnesium', 'N/A')} mg/L",
        f"    - Sodium: {features.get('sodium', 'N/A')} mg/L",
        f"    - Chloride: {features.get('chloride', 'N/A')} mg/L",
        f"    - Sulphate: {features.get('sulphate', 'N/A')} mg/L",
        f"    - Iron: {features.get('iron', 'N/A')} mg/L",
        f"    - Manganese: {features.get('manganese', 'N/A')} mg/L",
        f"    - Nitrate: {features.get('nitrate', 'N/A')} mg/L",
        f"    - Fluoride: {features.get('fluoride', 'N/A')} mg/L",
        f"    - Color: {features.get('color', 'N/A')}",
        f"    - Turbidity: {features.get('turbidity', 'N/A')} NTU",
        f"    - E. coli: {features.get('e_coli', 'N/A')}"
    ])
    combined_prompt = f"""{query}\n\nWater analysis (lab results):\n{water_analysis}"""
    # Query RAG index for context
    context_chunks = query_index(combined_prompt, k=3)
    # Generate LLM answer (recommendation)
    try:
        recommendation, *_ = generate_answer(combined_prompt, context_chunks)
        # Return as JSON, avoid double parsing
        return {"recommendation": recommendation}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        import os
        os.remove(tmp_path)


@app.post("/api/cart/populate_from_llm")
async def populate_cart_from_llm(request: Request):
    """
    Accepts a JSON body with an LLM Recommendation (matching the Recommendation schema),
    enriches it with ERP data, and overwrites the in-memory cart.
    Handles errors gracefully if the LLM output is malformed.
    """
    import logging
    try:
        data = await request.json()
        # Defensive: log and check keys
        logger = logging.getLogger(__name__)
        required_keys = ["pretreatment", "RO", "postreatment"]
        missing = [k for k in required_keys if k not in data]
        if missing:
            logger.error(f"Missing keys in LLM output: {missing}. Full LLM output: {data}")
            return JSONResponse({"error": f"LLM output missing required keys: {missing}", "llm_output": data}, status_code=400)
        try:
            recommendation = Recommendation(**data)
        except Exception as e:
            logger.error(f"Failed to parse LLM output as Recommendation: {e}. LLM output: {data}")
            return JSONResponse({"error": f"Failed to parse LLM output as Recommendation: {e}", "llm_output": data}, status_code=400)
        enriched = enrich_recommendation_with_erp(recommendation)
        with cart_lock:
            # Overwrite cart with new sections and products
            quotation_cart[0]["products"] = [dict(p, quantity=1) for p in enriched.get('pretreatment', [])]
            quotation_cart[1]["products"] = [dict(p, quantity=1) for p in enriched.get('RO', [])]
            quotation_cart[2]["products"] = [dict(p, quantity=1) for p in enriched.get('postreatment', [])]
        return {"sections": quotation_cart}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=400)


from pydantic import BaseModel
from typing import Optional



class PretreatmentModel(BaseModel):
    product: str
    model: str
    pumps: Optional[str] = None
    filters: Optional[str] = None
    chemicals: Optional[str] = None
    media: Optional[str] = None
    dosage: Optional[str] = None
    description: str

class ROSystemModel(BaseModel):
    model: str
    capacity: str
    membrane_type: str
    membrane_count: int
    antiscalant_type: str
    pumps: Optional[str] = None
    chemicals: Optional[str] = None
    dosage: Optional[str] = None
    description: str

class PostTreatmentModel(BaseModel):
    product: str
    model: str
    pumps: Optional[str] = None
    filters: Optional[str] = None
    chemicals: Optional[str] = None
    media: Optional[str] = None
    dosage: Optional[str] = None
    description: str



import os
import json
from openai import OpenAI
import traceback

from typing import List, Optional

class AnalyzeRequest(BaseModel):
    tds: float
    ph: float
    hardness: float
    alkalinity: float
    location: str
    use_case: str
    industry: Optional[str] = None
    daily_demand: float

class QuotationItem(BaseModel):
    name: str
    model: str
    unit_price: float
    quantity: int
    total_price: float

class QuotationModel(BaseModel):
    items: List[QuotationItem]
    total: float

class AnalyzeResponse(BaseModel):
    pretreatment: PretreatmentModel
    ro_system: ROSystemModel
    posttreatment: PostTreatmentModel
    quotation: QuotationModel
    explanation: str

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(request: AnalyzeRequest):
    """
    Analyze water parameters and requirements, return JSON with explicit fields for proposal and quotation.
    """
    try:
        prompt = f'''
You are a water treatment system design expert. Please design a complete water treatment pipeline for the following scenario:

- Water source: Borehole
- Daily demand: 0.5 m3/hr
- Use: Domestic purposes
- Location: {request.location}
- Water analysis (lab results):
    - TDS: {request.tds} mg/L
    - pH: {request.ph}
    - Hardness: {request.hardness} mg/L
    - Alkalinity: {request.alkalinity} mg/L
    {f'- Industry: {request.industry}' if request.industry else ''}

Requirements:
1. The pipeline must include: pretreatment, RO system design, and posttreatment stages.
2. For each stage, specify:
    - Type and model of pumps
    - Type and model of filters
    - Chemicals to use (with dosage and purpose)
    - Water treatment media
    - RO system details (model, membrane type/count, antiscalant, capacity, etc.)
3. Provide a quotation table: each item must have name, model, unit price, quantity, and total price.
4. Provide a simple explanation for the customer.

Respond ONLY with a valid JSON object with these fields:
- pretreatment: { product, model, pumps, filters, chemicals, media, dosage, description }
- ro_system: { model, capacity, membrane_type, membrane_count, antiscalant_type, pumps, chemicals, dosage, description }
- posttreatment: { product, model, pumps, filters, chemicals, media, dosage, description }
- quotation: { items: [ {name, model, unit_price, quantity, total_price} ], total }
- explanation: string

Do NOT include any extra text or commentary. Return only the JSON object.
'''

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a water treatment expert specializing in RO system design."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        # MOCK START: Replace LLM/AI output with a hardcoded valid response for testing
        # raw_content = response.choices[0].message.content
        try:
            data = {
                "pretreatment": {
                    "product": "Media Filter",
                    "model": "MF-100",
                    "description": "Pretreatment step"
                },
                "ro_system": {
                    "model": "RO-500",
                    "capacity": "500 LPH",
                    "membrane_type": "BW30",
                    "membrane_count": 2,
                    "antiscalant_type": "Type-A",
                    "description": "Main RO system"
                },
                "posttreatment": {
                    "product": "UV",
                    "model": "UV-20",
                    "description": "Posttreatment step"
                },
                "quotation": {
                    "items": [
                        {
                            "name": "DOW FILMTEC BW30-400",
                            "model": "DOW FILMTEC BW30-400",
                            "unit_price": 0,
                            "quantity": 2,
                            "total_price": 0
                        },
                        {
                            "name": "GRUNDFOS CR 10-8",
                            "model": "GRUNDFOS CR 10-8",
                            "unit_price": 0,
                            "quantity": 1,
                            "total_price": 0
                        }
                    ],
                    "total": 0
                },
                "explanation": "Sample explanation"
            }
        # MOCK END
            logger.info(f"LLM raw JSON received: {data}")
            # Backend validation for required fields
            missing = []
            for key in ["pretreatment", "ro_system", "posttreatment"]:
                if key not in data or not isinstance(data[key], dict):
                    missing.append(key)
            if missing:
                logger.error(f"Missing required keys in LLM output: {missing}")
                raise HTTPException(status_code=500, detail={"error": f"Missing required keys in LLM output: {missing}"})
            logger.info(f"Validated product JSON for ERP: pretreatment={data['pretreatment']}, ro_system={data['ro_system']}, posttreatment={data['posttreatment']}")
            # ERP lookup: enrich quotation items with ERP data
            if 'quotation' in data and 'items' in data['quotation']:
                for item in data['quotation']['items']:
                    product_no = item.get('model') or item.get('name')
                    if product_no:
                        erp_details = get_product_details(product_no)
                        if erp_details:
                            item['unit_price'] = erp_details.get('unit_price', item.get('unit_price', 0))
                            item['description'] = erp_details.get('description', item.get('description', ''))
                logger.info("ERP enrichment of quotation items complete.")
            return data
        except Exception as e:
            tb = traceback.format_exc()
            error_message = str(e)
            print(f"/analyze error: {error_message}\n{tb}")
            raise HTTPException(status_code=500, detail={"error": error_message, "traceback": tb})
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))



# Serve static images for proposal template
from fastapi.staticfiles import StaticFiles
app.mount("/images", StaticFiles(directory="public/images"), name="images")

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Example structure for extracted features JSON from lab report:
# {
#     "tds": 800,
#     "ph": 7.2,
#     "hardness": 250,
#     "alkalinity": 120,
#     "calcium": 60,
#     "magnesium": 20,
#     "sodium": 30,
#     "chloride": 50,
#     "sulphate": 10,
#     "iron": 0.1,
#     "manganese": 0.05,
#     "nitrate": 5,
#     "fluoride": 1.2,
#     "color": 5,
#     "turbidity": 1.5,
#     "e_coli": 0,
#     ... (other relevant parameters)
# }
@app.post("/extract-features")
async def extract_features_from_lab_report(report: UploadFile = File(...)):
    """
    Extract water analysis features from a lab report PDF and store as JSON in the database.
    Returns the new lab report's ID and features.
    """
    import datetime
    db = SessionLocal()
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(report.file, tmp)
        tmp_path = tmp.name
    features = {}
    try:
        with pdfplumber.open(tmp_path) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            # Helper to extract numeric values
            def extract_val(label, unit=None, default=None, regex=None):
                if regex:
                    match = re.search(regex, text, re.IGNORECASE)
                else:
                    match = re.search(fr"{label}\s*[:=]?\s*([\d\.]+)\s*{unit if unit else ''}", text, re.IGNORECASE)
                return float(match.group(1)) if match else default
            def extract_text_field(label, default=None, regex=None):
                # Try to extract from table cell first
                match = re.search(fr"<td>\s*{label}\s*[:：]?\s*([A-Za-z0-9\s\-\,\.]+)</td>", text, re.IGNORECASE)
                if match:
                    value = match.group(1).strip()
                    logger.info(f"Extracted {label} from <td>: {value}")
                    return value
                # Try generic regex if provided
                if regex:
                    match = re.search(regex, text, re.IGNORECASE)
                    if match:
                        value = match.group(2).strip() if match.lastindex and match.lastindex >= 2 else match.group(1).strip()
                        logger.info(f"Extracted {label} from regex: {value}")
                        return value
                # Try plain text pattern
                match = re.search(fr"{label}\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)", text)
                if match:
                    value = match.group(1).strip()
                    logger.info(f"Extracted {label} from plain text: {value}")
                    return value
                logger.info(f"Failed to extract {label}, using default: {default}")
                return default

            features = {
                # Extract text fields
                "client_name": (
                    extract_text_field("Client :", regex=r"Client\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    extract_text_field("Client Name", regex=r"Client Name\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    extract_text_field("Customer Name", regex=r"Customer Name\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    extract_text_field("Name", regex=r"Name\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    None
                ),
                "report_id": (
                    extract_text_field("Report ID", regex=r"Report ID\s*[:=]?\s*([A-Za-z0-9\-]+)") or
                    extract_text_field("Sample ID", regex=r"Sample ID\s*[:=]?\s*([A-Za-z0-9\-]+)") or
                    extract_text_field("Lab Report No", regex=r"Lab Report No\s*[:=]?\s*([A-Za-z0-9\-]+)") or
                    None
                ),
                "sample_location": (
                    extract_text_field("Site Location", regex=r"Site Location\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    extract_text_field("Sample Location", regex=r"Sample Location\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    extract_text_field("Location", regex=r"Location\s*[:=]?\s*([A-Za-z0-9\s\-\,\.]+)") or
                    None
                ),
                "report_date": (
                    extract_text_field("Report Date", regex=r"Report Date\s*[:=]?\s*([\d\-/]+)") or
                    extract_text_field("Date", regex=r"Date\s*[:=]?\s*([\d\-/]+)") or
                    None
                ),
                # Extract numeric fields
                "tds": extract_val("TDS", "mg/L"),
                "ph": extract_val("pH"),
                "hardness": extract_val("Hardness", "mg/L"),
                "alkalinity": extract_val("Alkalinity", "mg/L"),
                "calcium": extract_val("Calcium", "mg/L"),
                "magnesium": extract_val("Magnesium", "mg/L"),
                "sodium": extract_val("Sodium", "mg/L"),
                "chloride": extract_val("Chloride", "mg/L"),
                "sulphate": extract_val("Sulphate", "mg/L"),
                "iron": extract_val("Iron", "mg/L"),
                "manganese": extract_val("Manganese", "mg/L"),
                "nitrate": extract_val("Nitrate", "mg/L"),
                "fluoride": extract_val("Fluoride", "mg/L"),
                "color": extract_val("Color"),
                "turbidity": extract_val("Turbidity", "NTU"),
                "e_coli": extract_val("E.coli"),
            }

            # Store in DB
            lab_report = LabReport(
                client_name=features["client_name"],
                sample_id=features["report_id"],
                report_date=features["report_date"],
                features_json=features
            )
            db.add(lab_report)
            db.commit()
            db.refresh(lab_report)
    finally:
        os.remove(tmp_path)
        db.close()
    return {"lab_report_id": lab_report.id, "features": features}

@app.post("/api/generate-proposal")
async def generate_proposal_api(
    report: UploadFile = File(...),
    query: str = Form(...)
):
    # Save the uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        shutil.copyfileobj(report.file, tmp)
        pdf_path = tmp.name

    # Extract text and tables from PDF
    extracted_text = ""
    tables_html = ""
    client_name = ""
    sample_id = ""
    sample_date = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                extracted_text += text + "\n"
                # Try to extract tables as HTML
                for table in page.extract_tables():
                    tables_html += "<table>"
                    for row in table:
                        tables_html += "<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>"
                    tables_html += "</table>"
        logger.info("===== EXTRACTED TEXT FROM PDF =====\n%s", extracted_text)
        logger.info("===== EXTRACTED TABLES (HTML) =====\n%s", tables_html)
    except Exception as e:
        logger.error("PDF extraction failed: %s", e)
        extracted_text = ""
        tables_html = ""
    # Try to extract client name, sample id, date using regex (customize as needed)
    client_name_match = re.search(r"Client Name[:\s]+([A-Za-z ]+)", extracted_text, re.IGNORECASE)
    if client_name_match:
        client_name = client_name_match.group(1).strip()
    else:
        # Fallback: try to find a name in the first 100 chars
        client_name = extracted_text[:100].split('\n')[0].strip()
    sample_id_match = re.search(r"Sample ID[:\s]+([\w\-/]+)", extracted_text, re.IGNORECASE)
    if sample_id_match:
        sample_id = sample_id_match.group(1).strip()
    sample_date_match = re.search(r"Date[:\s]+([\d\w ,]+)", extracted_text, re.IGNORECASE)
    if sample_date_match:
        sample_date = sample_date_match.group(1).strip()
    logger.info("Client Name: %s | Sample ID: %s | Sample Date: %s", client_name, sample_id, sample_date)
    # Compose a context for the RAG pipeline
    # Add the extracted text as extra context to the query
    rag_query = f"{query}\n\nReport Content:\n{extracted_text}"
    relevant_chunks = query_index(rag_query, k=5)
    rag_answer = generate_answer(query, relevant_chunks)

    from bs4 import BeautifulSoup
    def parse_who_standard(who_str):
        who_str = who_str.strip()
        if who_str.lower() in ('ns', 'nil', 'nd', ''):
            return None
        # Handle range e.g. '6.5 - 8.50'
        range_match = re.match(r'([<>]?)\s*([\d.]+)\s*-\s*([\d.]+)', who_str)
        if range_match:
            return float(range_match.group(2)), float(range_match.group(3))
        # Handle < or >
        comp_match = re.match(r'([<>])\s*([\d.]+)', who_str)
        if comp_match:
            op, val = comp_match.groups()
            return (op, float(val))
        # Handle single value
        try:
            return float(who_str)
        except Exception:
            return who_str

    def compare_result_to_standard(result, standard):
        try:
            result = float(result)
        except Exception:
            return False
        if isinstance(standard, tuple):
            if len(standard) == 2 and isinstance(standard[0], float):  # range
                return not (standard[0] <= result <= standard[1])
            elif len(standard) == 2 and isinstance(standard[0], str):  # < or >
                op, val = standard
                if op == '<':
                    return result >= val
                elif op == '>':
                    return result <= val
        elif isinstance(standard, float):
            return result != standard
        return False

    def extract_failed_parameters_from_html(table_html):
        failed = []
        soup = BeautifulSoup(table_html, 'html.parser')
        header_indices = {}
        header_found = False
        for row in soup.find_all('tr'):
            cells = row.find_all('td')
            cell_texts = [cell.get_text(strip=True).lower() for cell in cells]
            # Detect header row
            if not header_found:
                for idx, text in enumerate(cell_texts):
                    if 'parameter' in text:
                        header_indices['parameter'] = idx
                    elif 'unit' in text:
                        header_indices['unit'] = idx
                    elif 'value' in text or 'result' in text:
                        header_indices['result'] = idx
                    elif 'who guideline' in text or 'who standard' in text:
                        header_indices['who_standard'] = idx
                if len(header_indices) >= 3:
                    header_found = True
                continue  # skip header row
            # Data rows
            if len(header_indices) < 3 or len(cells) < max(header_indices.values()) + 1:
                continue  # skip malformed rows
            parameter = cells[header_indices['parameter']].get_text(strip=True)
            unit = cells[header_indices['unit']].get_text(strip=True)
            result = cells[header_indices['result']].get_text(strip=True)
            who_standard = cells[header_indices['who_standard']].get_text(strip=True)
            if not parameter or not who_standard or not result:
                continue
            standard = parse_who_standard(who_standard)
            if standard is None:
                continue
            # Handle ND (Not Detected) and non-numeric results
            try:
                numeric_result = float(result)
            except Exception:
                continue
            if compare_result_to_standard(numeric_result, standard):
                failed.append({
                    "parameter": parameter,
                    "unit": unit,
                    "result": result,
                    "who_standard": who_standard
                })
        return failed

    failed_parameters = extract_failed_parameters_from_html(tables_html)

    # Compose the context for the proposal template
    context = {
        "user_query": query,
        "proposal_number": "CO/DND/WTS/0454165",
        "date": sample_date or "23 April, 2025",
        "client_name": client_name or "Unknown",
        "capacity": "250 litres/hr",  # Could extract from report if present
        "lab_sample_id": sample_id or "N/A",
        "lab_sample_date": sample_date or "N/A",
        "parameter_table": tables_html or "<p>No lab results found.</p>",
        "flow_rate": "0.25 m³/hr",
        "dsl_scope": "<ul><li>Fabrication and assembly of equipment.</li></ul>",
        "client_scope": "<ul><li>Provide a well-ventilated plant room.</li></ul>",
        "pricing_table": "<table><tr><td>SUPPLY & INSTALLATION OF A WATER TREATMENT PLANT -250 LIT/HR</td><td>1</td><td>1,532,550</td></tr></table>",
        # Add RAG answer as a new section or field
        "rag_analysis": rag_answer,
        "failed_parameters": failed_parameters,
    }
    logger.info("===== FINAL CONTEXT TO TEMPLATE =====\n%s", context)
    html = render_proposal(context)
    return HTMLResponse(content=html, status_code=200)

@app.get("/api/ping")
def ping():
    return JSONResponse({"status": "ok"})
