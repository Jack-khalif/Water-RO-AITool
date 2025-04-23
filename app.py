from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Optional
import shutil
import os
import pdfplumber
from generate_proposal import render_proposal
from query_rag import query_index, generate_answer
import tempfile
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

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
