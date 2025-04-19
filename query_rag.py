import os
import csv
import faiss
import numpy as np
import openai

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

INDEX_FILE = "rag_faiss.index"
MAPPING_FILE = "rag_mapping.csv"
EMBED_MODEL = "text-embedding-ada-002"

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

def get_embedding(text):
    response = openai.embeddings.create(input=[text], model=EMBED_MODEL)
    return np.array(response.data[0].embedding, dtype=np.float32).reshape(1, -1)

def query_index(query, k=5):
    # Load index and mapping
    index = faiss.read_index(INDEX_FILE)
    chunks, sources = load_mapping()
    
    # Get query embedding
    query_embedding = get_embedding(query)
    
    # Search index
    distances, indices = index.search(query_embedding, k)
    
    results = []
    for i, idx in enumerate(indices[0]):
        if idx != -1:  # -1 means no result
            results.append({
                "chunk": chunks[idx],
                "source": sources[idx],
                "distance": float(distances[0][i])
            })
    
    return results

def generate_answer(query, context_chunks):
    # Combine context chunks
    context = "\n\n---\n\n".join([c["chunk"] for c in context_chunks])
    
    # Create prompt
    prompt = f"""Based on the following information from water treatment documentation, please answer the question.

Question: {query}

Relevant Information:
{context}

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

def main():
    while True:
        query = input("\nHow may i help today Engineer? (or 'quit' to exit): ")
        if query.lower() in ["quit", "exit", "q"]:
            break
        
        print("\nSearching knowledge base...")
        results = query_index(query, k=3)
        
        if not results:
            print("No relevant information found.")
            continue
        
        print("\nTop relevant chunks:")
        for i, res in enumerate(results):
            print(f"\n--- Result {i+1} ---")
            print(f"Source: {res['source']}")
            print(f"Distance: {res['distance']:.4f}")
            print(f"Content: {res['chunk'][:200]}...")
        
        print("\nGenerating answer...")
        answer = generate_answer(query, results)
        
        print("\n=== Answer ===\n")
        print(answer)

if __name__ == "__main__":
    main()
