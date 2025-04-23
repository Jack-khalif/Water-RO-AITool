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

def extract_text_and_images_from_pdf(pdf_path, image_dir="reference_images"):
    text_chunks = []
    sources = []
    os.makedirs(image_dir, exist_ok=True)
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # Extract text as before
            text = page.extract_text() or ""
            text_chunks.extend(chunk_text(text))
            sources.extend([f"{pdf_path}#page={page_num+1}" for _ in chunk_text(text)])
            # Extract images and captions (caption = nearest text above image)
            for img_idx, img in enumerate(page.images):
                # Extract image
                image_obj = page.to_image(resolution=150)
                pil_img = image_obj.original  # PIL Image
                width, height = pil_img.size
                # Clamp coordinates to image bounds
                left = max(0, img['x0'])
                upper = max(0, img['top'])
                right = min(width, img['x1'])
                lower = min(height, img['bottom'])
                if left < right and upper < lower:
                    try:
                        cropped = pil_img.crop((left, upper, right, lower))
                        img_filename = f"{os.path.splitext(os.path.basename(pdf_path))[0]}_p{page_num+1}_img{img_idx+1}.png"
                        img_path = os.path.join(image_dir, img_filename)
                        cropped.save(img_path, format='PNG')
                    except Exception as e:
                        print(f"[WARN] Could not extract image from {pdf_path}, page {page_num+1}, img {img_idx+1}: {e}")
                        img_path = None
                else:
                    img_path = None
                # Find caption (nearest text above image)
                caption = ""
                if page.extract_words():
                    words_above = [w for w in page.extract_words() if w['bottom'] < img['top']]
                    if words_above:
                        # Use the last word above as caption context
                        last_word = words_above[-1]
                        # Get all words on the same line as the last word
                        line_words = [w['text'] for w in page.extract_words() if abs(w['bottom'] - last_word['bottom']) < 3]
                        caption = " ".join(line_words)
                # If no caption, fallback to page text
                if not caption:
                    caption = f"Image from {os.path.basename(pdf_path)}, page {page_num+1}"
                # Add image caption as a chunk, source is the image path
                text_chunks.append(f"[IMAGE] {caption}")
                sources.append(img_path)
            # Extract tables (robust, markdown format)
            tables = page.extract_tables()
            for t_idx, table in enumerate(tables):
                if not table or not any(table):
                    continue
                # Convert table to Markdown
                md_rows = []
                for row in table:
                    # Replace None with empty string, convert all to str
                    safe_row = [str(cell) if cell is not None else '' for cell in row]
                    md_rows.append('| ' + ' | '.join(safe_row) + ' |')
                # Add header separator if table has header
                if len(md_rows) > 1:
                    header_sep = '| ' + ' | '.join(['---'] * len(table[0])) + ' |'
                    md_rows.insert(1, header_sep)
                table_md = '\n'.join(md_rows)
                chunk = f"[TABLE] Page {page_num+1} Table {t_idx+1}:\n{table_md}"
                text_chunks.append(chunk)
                sources.append(f"{pdf_path}#page={page_num+1} (table {t_idx+1})")
    return text_chunks, sources

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
                text_chunks, img_sources = extract_text_and_images_from_pdf(file)
                chunks.extend(text_chunks)
                sources.extend(img_sources)
            elif ext == "xlsx":
                new_chunks = extract_text_from_xlsx(file)
                chunks.extend(new_chunks)
                sources.extend([file] * len(new_chunks))
            else:
                continue
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
