import os
import glob
import pdfplumber
import openai
import faiss
import numpy as np
import pandas as pd

openai.api_key = os.getenv("OPENAI_API_KEY")

REFERENCE_DIR = "reference_docs"
INDEX_FILE = "rag_faiss.index"
MAPPING_FILE = "rag_mapping.csv"
EMBED_MODEL = "text-embedding-ada-002"
CHUNK_SIZE = 1000  # characters

def chunk_text(text, chunk_size=CHUNK_SIZE):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size) if text[i:i+chunk_size].strip()]

def extract_text_from_pdf(pdf_path):
    text_chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extract text only, skip OCR/image
            text = page.extract_text() or ""
            text_chunks.extend(chunk_text(text))
    return text_chunks

def extract_text_from_xlsx(xlsx_path):
    df = pd.read_excel(xlsx_path, sheet_name=None)
    all_text = ""
    for sheet in df.values():
        all_text += sheet.to_string()
    return chunk_text(all_text)

def get_all_chunks():
    chunks = []
    sources = []
    for ext in ["pdf", "xlsx"]:
        files = glob.glob(os.path.join(REFERENCE_DIR, f"**/*.{ext}"), recursive=True)
        for file in files:
            if ext == "pdf":
                new_chunks = extract_text_from_pdf(file)
            elif ext == "xlsx":
                new_chunks = extract_text_from_xlsx(file)
            else:
                continue
            for chunk in new_chunks:
                chunks.append(chunk)
                sources.append(file)
    return chunks, sources

def embed_chunks(chunks):
    embeddings = []
    for i in range(0, len(chunks), 10):
        batch = chunks[i:i+10]
        response = openai.embeddings.create(input=batch, model=EMBED_MODEL)
        for emb in response.data:
            embeddings.append(np.array(emb.embedding, dtype=np.float32))
    return np.vstack(embeddings)

def main():
    print("Extracting and chunking all docs...")
    chunks, sources = get_all_chunks()
    print(f"Total chunks: {len(chunks)}")

    print("Embedding chunks with OpenAI...")
    embeddings = embed_chunks(chunks)
    print("Embeddings shape:", embeddings.shape)

    print("Building FAISS index...")
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    faiss.write_index(index, INDEX_FILE)

    print("Saving mapping...")
    import csv
    with open(MAPPING_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["chunk", "source"])
        writer.writerows(zip(chunks, sources))

    print("RAG index built and saved!")

if __name__ == "__main__":
    main()
