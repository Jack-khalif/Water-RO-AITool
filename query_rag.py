import os
import csv
import faiss
import numpy as np
import openai
import sys
import tiktoken
from dotenv import load_dotenv
from typing import List, Tuple, Dict, Optional, Union, Any
from pydantic import BaseModel, Field
import re
import json
import requests
from requests.auth import HTTPBasicAuth
import PyPDF2

# Load environment variables from .env
load_dotenv()

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

INDEX_FILE = "rag_faiss.index"
MAPPING_FILE = "rag_mapping.csv"
EMBED_MODEL = "text-embedding-3-small"

class Product(BaseModel):
    """Represents a Product to be used in the treatment pipeline."""
    product_description: str
    product_name: str
    model_number: str

class Recommendation(BaseModel):
    """Recommendations for pretreatment, RO, and posttreatment products."""
    pretreatment: List[Product]
    RO: List[Product]
    postreatment: List[Product]

def load_mapping():
    chunks = []
    sources = []
    categories = []
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            chunks.append(row[0])
            sources.append(row[1])
            # Add category if available, otherwise use "general"
            categories.append(row[2] if len(row) > 2 else "general")
    return chunks, sources, categories

def get_embedding(text, model=EMBED_MODEL):
    """Get embedding vector for text using OpenAI API."""
    response = openai.embeddings.create(input=[text], model=model)
    return np.array(response.data[0].embedding, dtype=np.float32).reshape(1, -1)

class RagAgent:
    """
    Retrieval Augmented Generation (RAG) agent for water treatment recommendations.

    This class handles:
    1. Query processing and vectorization
    2. Contextual retrieval from FAISS index
    3. LLM inference using OpenAI models
    4. Response parsing and formatting
    """

    def __init__(
        self,
        index_file=INDEX_FILE,
        mapping_file=MAPPING_FILE,
        embedding_model=EMBED_MODEL,
        context_token_limit=6700,
        docs_per_retrieval=10
    ):
        """
        Initialize the RAG agent with configuration.

        Args:
            index_file: Path to FAISS index file
            mapping_file: Path to mapping CSV file
            embedding_model: Name of the embedding model to use
            context_token_limit: Maximum tokens for context
            docs_per_retrieval: Number of documents to retrieve
        """
        print("Initializing the RAG Agent")
        self.index_file = index_file
        self.mapping_file = mapping_file
        self.embedding_model = embedding_model
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.context_token_limit = context_token_limit
        self.docs_per_retrieval = docs_per_retrieval
        
        # Load index and mapping
        self.index = faiss.read_index(index_file)
        self.chunks, self.sources, self.categories = load_mapping()

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using the tokenizer."""
        num_tokens = len(self.tokenizer.encode(text))
        return num_tokens

    def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text using OpenAI API."""
        response = openai.embeddings.create(
            input=[text],
            model=self.embedding_model
        )
        return np.array(response.data[0].embedding, dtype=np.float32).reshape(1, -1)

    def get_top_k(self, query_embedding: np.ndarray, k: int) -> Dict:
        """Retrieve top k documents."""
        # Search index
        distances, indices = self.index.search(query_embedding, k)
        
        results = {
            "documents": [],
            "metadatas": [],
            "distances": []
        }
        
        for i, idx in enumerate(indices[0]):
            if idx != -1:  # -1 means no result
                results["documents"].append(self.chunks[idx])
                results["metadatas"].append({"source": self.sources[idx], "category": self.categories[idx]})
                results["distances"].append(float(distances[0][i]))
        
        return results

    def build_context(self, search_query: str) -> str:
        """
        Build retrieval context by querying the vector index.

        Args:
            search_query: Processed search query for retrieval

        Returns:
            String containing formatted context from retrieved documents
        """
        print("Building RAG Context")
        try:
            query_embedding = self.get_embedding(search_query)
            print(f"Generated embedding of shape {query_embedding.shape}")
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            # Generate a fallback random embedding
            query_embedding = np.random.rand(1, 1536).astype(np.float32)
            print("Using random fallback embedding")
        
        parts, total_tokens = [], 0

        try:
            # Get top documents
            print(f"Querying FAISS index")
            results = self.get_top_k(query_embedding, self.docs_per_retrieval)

            if not results or len(results["documents"]) == 0:
                print("No results found!")
                return "No relevant documents found in the knowledge base."

            docs = results["documents"]
            metas = results["metadatas"]
            dists = results["distances"]

            print(f"Found {len(docs)} documents")

            for i, (doc, md, dist) in enumerate(zip(docs, metas, dists)):
                # Format header with source and relevance score
                category = md.get("category", "general")
                source = md.get("source", "unknown")
                header = f"\n## {category.title()} (rel={1 - dist/2:.2f}, source={source})\n"
                snippet = doc

                # Truncate by token budget
                remain = self.context_token_limit - total_tokens - len(self.tokenizer.encode(header))
                if remain <= 0:
                    print(f"Reached token limit at document {i}")
                    break

                tokens = self.tokenizer.encode(snippet)[:remain]
                snippet = self.tokenizer.decode(tokens)

                part = header + snippet + "\n"
                
                parts.append(part)
                total_tokens += len(self.tokenizer.encode(part))
                print(f"Added document {i}, total tokens now: {total_tokens}")
                
                if total_tokens >= self.context_token_limit:
                    break

        except Exception as e:
            error_msg = f"Error retrieving documents: {str(e)}"
            print(error_msg)
            parts.append(f"\n## Error retrieving documents: {str(e)}\n")

        context = "\n".join(parts)
        print(f"Built context with {total_tokens} tokens across {len(parts)} parts")
        return context

    def generate_search_query(self, lab_json: str, user_query: str, model: str = "gpt-4") -> str:
        """
        Generate optimized search query from lab report and user request.

        Args:
            lab_json: JSON string containing water lab analysis
            user_query: Original user query
            model: Model to use for query generation

        Returns:
            Optimized search query for retrieval
        """
        print("Generating search query")
        system_prompt = (
            "You are an AI assistant that converts a JSON-formatted water lab report into a concise, "
            "action-oriented search query for semantic retrieval from a vector database of water-treatment equipment "
            "and design guides. When you receive a JSON input, you must:\n"
            "1. Extract and name the site location, source and analysis date.\n"
            "2. List each parameter that exceeds WHO guidelines, giving its name, unit, and value.\n"
            "3. Summarize in keyword form the recommended treatment stages under three headings:\n"
            "   - Pretreatment - Pre-treatment to be done before the RO (e.g. coagulation, sedimentation, multimedia filtration)\n"
            "   - RO Type  (e.g. 250 L/hr high-pressure pump, high-TDS membranes @30 bar)\n"
            "   - Posttreatment (e.g. cation-exchange softener, Mn/Cu adsorption, airblower)\n"
            "   - Comments: (e.g. High TDS 18810 & EC 26490: require 250 L/hr RO with 30-40 bar high-pressure pump + antiscalant dosing; 3250 mg/L hardness: add cation-exchange softener; Mn 0.17 & Cu 4.18: install metal-specific adsorption resin; Turbidity 6 NTU: coagulation + multimedia filtration)\n\n"
            "The website url is : https://www.davisandshirtliff.com/products-and-solutions/"
            "Include products -like chemical dosage, chemicals, airblowers, pumps, water treatment media, filters, and type of ros to use-"
            "depending on the pretreatment and posttreatment depending on the RO chosen based on the results from lab report."
            "Avoid repeating of products or giving a product dealing with a pretreatment that another product has already dealt with"
            "Just be as accurate as possible when giving results"
            "*First*, emit ONLY a JSON object matching these Pydantic schemas (no extra keys):\n\n"
            "python\n"
            "class Product(BaseModel):\n"
            "    product_description: str\n"
            "    product_name: str\n"
            "    model_number: str\n\n"
            "class Recommendation(BaseModel):\n"
            "    pretreatment: list[Product]\n"
            "    RO:           list[Product]\n"
            "    postreatment: list[Product]\n"
            "\n\n"
            "*Then*, in Markdown, explain your approach under these headings:\n"
            "**RO SELECTED**, **Pretreatment**, **Posttreatment**."
        )

        user_prompt = (
            f"{user_query}\n"
            "Please transform the following water lab report (JSON) into a concise search query as per the system instructions.\n"
            "json\n"
            f"{lab_json}\n"
            ""
        )

        response = openai.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=500,
            temperature=0.0
        )
        print(response.choices[0].message.content)
        return response.choices[0].message.content

    def extract_json_and_markdown(self, response_text: str) -> Tuple[str, str]:
        """
        Extract JSON and markdown parts from model response.

        Args:
            response_text: Raw response from LLM

        Returns:
            Tuple of (json_string, markdown_explanation)
        """
        # Try to find JSON block using regex patterns for code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_part = json_match.group(1).strip()
            # Remove the JSON block to get markdown
            markdown_part = re.sub(r'```(?:json)?\s*[\s\S]*?\s*```', '', response_text, 1).strip()
            return json_part, markdown_part

        # Try to find first JSON object with opening/closing braces
        json_match = re.search(r'(\{[\s\S]*\})', response_text)
        if json_match:
            json_part = json_match.group(1).strip()
            # Get everything after the JSON
            parts = response_text.split(json_match.group(1), 1)
            markdown_part = parts[1].strip() if len(parts) > 1 else ""
            return json_part, markdown_part

        # Try finding JSON after a marker like "JSON:" or "JSON Object:"
        json_marker_match = re.search(r'(?:JSON|JSON Object|JSON Response):\s*(\{[\s\S]*\})', response_text, re.IGNORECASE)
        if json_marker_match:
            json_part = json_marker_match.group(1).strip()
            # Get content after the JSON
            parts = response_text.split(json_part, 1)
            markdown_part = parts[1].strip() if len(parts) > 1 else ""
            return json_part, markdown_part

        # Fallback: try splitting by double newline and assume first part is JSON
        parts = response_text.split("\n\n", 1)
        if len(parts) == 2 and parts[0].strip().startswith('{') and parts[0].strip().endswith('}'):
            return parts[0].strip(), parts[1].strip()

        # If all else fails
        raise ValueError("Could not extract JSON and markdown from the response")

    def fix_json_format(self, json_str: str) -> str:
        """Attempt to fix common JSON formatting issues."""
        # Replace single quotes with double quotes
        json_str = re.sub(r"(?<!\w)'(.*?)'(?!\w)", r'"\1"', json_str)

        # Fix missing quotes around keys
        json_str = re.sub(r'(\s*)(\w+)(\s*):(\s*)', r'\1"\2"\3:\4', json_str)

        # Fix trailing commas
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)

        return json_str

    def json_summarizer(self, json_part: str) -> str:
        """
        Receives a json file and summarizes it to be fed into the LLM

        Args:
            json_part: JSON string to summarize

        Returns:
            Summarized version of the JSON
        """
        print("Getting the Lab results Summary")
        model_name = "gpt-4"
        system_prompt = "You are a Water treatment analyst. You will receive a JSON format input containing lab test results. Provide a clear, detailed summary interpreting all fields."
        system_prompt += "Keep most of the information as possible. Summarize the comments too. Just summarize everything."
        
        response = openai.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"{system_prompt}"
                },
                {
                    "role": "user",
                    "content": f" Please give a detailed summary of the results below:\n{json_part}",
                }
            ],
            temperature=0.2,
            top_p=1.0,
            max_tokens=1500,
            model=model_name
        )
        return response.choices[0].message.content

    def get_recommendations(
        self,
        rag_context: str,
        rag_summary: str,
        user_query: str,
        model: str = "gpt-4",
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> Tuple[Recommendation, str]:
        """
        Get recommendations using OpenAI models.

        Args:
            rag_context: Retrieved context from vector DB
            rag_summary: Summary of lab results
            user_query: User query with requirements
            model: OpenAI model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens for response

        Returns:
            Tuple of (recommendation_object, explanation_markdown)
        """
        print("Generating recommendations")
        system_prompt = (
            "You are an expert water-treatment design assistant. You will receive three inputs:  "
            "1) RAG-retrieved context containing technical excerpts on pumps, filters, RO membranes, "
            "and training-manual guidance. 2) A user request specifying capacity, application, and lab results.  "
            "3) A url which contains the company websites products which you must scrape in detail and find "
            "products you will pass as a recommendation in case the rag context does not contain all the products you need for the recommendation."
            "Your task is to select the optimal Reverse Osmosis unit and then specify its required pretreatment and post-treatment products, "
            "Recommend products mentioned in the context and those found at the url given\n\n"
            "The website url is : https://www.davisandshirtliff.com/products-and-solutions/"
            "Include products -like chemical dosage, chemicals, airblowers, pumps, water treatment media, filters, and type of ros to use-"
            "depending on the pretreatment and posttreatment depending on the RO chosen based on the results from lab report."
            "Avoid repeating of products or giving a product dealing with a pretreatment that another product has already dealt with"
            "Just be as accurate as possible when giving results"
            "*First*, emit ONLY a JSON object matching these Pydantic schemas (no extra keys):\n\n"
            "python\n"
            "class Product(BaseModel):\n"
            "    product_description: str\n"
            "    product_name: str\n"
            "    model_number: str\n\n"
            "class Recommendation(BaseModel):\n"
            "    pretreatment: list[Product]\n"
            "    RO:           list[Product]\n"
            "    postreatment: list[Product]\n"
            "\n\n"
            "*Then*, in Markdown, explain your approach under these headings:\n"
            "**RO SELECTED**, **Pretreatment**, **Posttreatment**."
        )

        user_prompt = (
            f"{rag_context}\n\n{user_query}\n\nBelow are the Water Lab Results:\n{rag_summary}"
        )

        response = openai.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )

        reply_text = response.choices[0].message.content.strip()

        # Extract JSON and markdown parts
        json_part, markdown_part = self.extract_json_and_markdown(reply_text)

        try:
            # Parse JSON into Pydantic model
            recommendation = Recommendation.model_validate_json(json_part)
            return recommendation, markdown_part
        except Exception as e:
            fixed_json = self.fix_json_format(json_part)
            try:
                recommendation = Recommendation.model_validate_json(fixed_json)
                return recommendation, markdown_part
            except Exception as e2:
                raise ValueError(f"Failed to parse recommendation: {e2}. JSON: {json_part}")

    def process(
        self,
        user_query: str,
        lab_report_json: str,
        model_name: str = "gpt-4",
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> Tuple[Recommendation, str]:
        """
        Process a user query and return water treatment recommendations.

        Args:
            user_query: User's request for treatment design
            lab_report_json: JSON string containing water lab analysis
            model_name: Specific model name to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens for response

        Returns:
            Tuple of (recommendation_object, explanation_markdown)
        """
        # Generate search query from lab report
        try:
            search_query = self.generate_search_query(lab_report_json, user_query)
            print(f"Search Query: {search_query}")
        except Exception as e:
            print(f"Error generating search query: {str(e)}")
            search_query = f"{user_query} water treatment system design"
            print(f"Using fallback search query: {search_query}")

        # Build context from vector DB
        try:
            rag_context = self.build_context(search_query)
            if not rag_context or len(rag_context.strip()) < 100:
                print("WARNING: RAG context is empty or very small!")
                # Add a fallback context in case the RAG retrieval fails
                rag_context = """
## Fallback Context
This is a fallback context since the RAG retrieval didn't return sufficient results.
Please design a water treatment system based on the lab report and user query directly.
"""
            print(f"RAG Context length: {len(rag_context)}")
        except Exception as e:
            print(f"Error building context: {str(e)}")
            rag_context = """
## Retrieval Error
There was an error retrieving context from the database.
Please design a water treatment system based on the lab report and user query directly.
"""
            print("Using fallback context due to error")

        # Lab Summary
        try:
            rag_summary = self.json_summarizer(lab_report_json)
            print(f"RAG Summary length: {len(rag_summary)}")
        except Exception as e:
            print(f"Error generating lab summary: {str(e)}")
            rag_summary = f"Lab report summary generation failed. Using raw JSON: {lab_report_json[:500]}..."

        # Get recommendations
        try:
            return self.get_recommendations(
                rag_context,
                rag_summary,
                user_query,
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens
            )
        except Exception as e:
            print(f"Error getting recommendations: {str(e)}")
            # Return a minimal recommendation with error
            fallback_rec = Recommendation(
                pretreatment=[Product(product_description="Error in processing", product_name="Error", model_number="N/A")],
                RO=[Product(product_description="Error in processing", product_name="Error", model_number="N/A")],
                postreatment=[Product(product_description="Error in processing", product_name="Error", model_number="N/A")]
            )
            return fallback_rec, f"Error processing request: {str(e)}"

def process_lab_report_and_query(lab_report_json: str, user_query: str) -> dict:
    """
    Main entry point for backend: takes a lab report JSON and user query,
    returns enriched product recommendations for the frontend cart.
    """
    rag_agent = RagAgent()
    # Process query and get recommendations
    recommendation, explanation = rag_agent.process(user_query, lab_report_json)
    # Enrich with ERP data
    enriched = enrich_recommendation_with_erp(recommendation)
    # Return both the enriched cart info and the LLM explanation
    return {
        "cart": enriched,
        "explanation": explanation
    }

def load_lab_report(file_path: str) -> str:
    """Load lab report JSON from file."""
    try:
        with open(file_path, 'r') as f:
            water_data = json.load(f)
        return json.dumps(water_data, indent=2)
    except FileNotFoundError:
        raise FileNotFoundError(f"Water analysis file not found: {file_path}")
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON format in file: {file_path}")

def extract_lab_report_from_pdf(pdf_path):
    """Extract text from a PDF lab report."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {str(e)}")
        return None

def convert_lab_report_to_json(lab_report_text):
    """
    Convert lab report text to JSON format using OpenAI.
    This can be replaced with a more structured extraction method if needed.
    """
    system_prompt = (
        "You are an assistant that extracts water analysis parameters from lab reports. "
        "Extract all numeric values and parameters from the following water lab report. "
        "Return ONLY a JSON object with the parameter names as keys and numeric values."
    )
    
    user_prompt = f"Here is the lab report text:\n\n{lab_report_text}"
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.0
    )
    
    # Extract the JSON from the response
    try:
        extracted_json = response.choices[0].message.content.strip()
        # Clean up the response if it contains markdown code blocks
        if "```json" in extracted_json:
            extracted_json = extracted_json.split("```json")[1].split("```")[0].strip()
        elif "```" in extracted_json:
            extracted_json = extracted_json.split("```")[1].split("```")[0].strip()
        # Parse to ensure it's valid JSON
        parsed = json.loads(extracted_json)
        return json.dumps(parsed)
    except Exception as e:
        print(f"Error parsing JSON: {str(e)}")
        return None

def build_index_from_folder(folder='reference', index_file=INDEX_FILE, mapping_file=MAPPING_FILE, chunk_size=1000):
    """Ingest docs from reference folder into FAISS index."""
    chunks, sources, categories = [], [], []
    for root, _, files in os.walk(folder):
        for file in files:
            path = os.path.join(root, file)
            ext = os.path.splitext(file)[1].lower()
            # Determine category from folder structure
            category = os.path.basename(root).lower()
            if category == "reference":
                category = "general"
                
            if ext in ['.txt', '.md', '.json', '.csv']:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
                for i in range(0, len(text), chunk_size):
                    chunks.append(text[i:i+chunk_size])
                    sources.append(path)
                    categories.append(category)
    
    print(f"Processing {len(chunks)} chunks for embedding...")
    embeddings = []
    batch_size = 10  # Process in batches to avoid API limits
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        batch_embeddings = [get_embedding(c)[0] for c in batch]
        embeddings.extend(batch_embeddings)
        print(f"Processed {i+len(batch)}/{len(chunks)} chunks")
    
    embeddings_array = np.array(embeddings, dtype=np.float32)
    idx = faiss.IndexFlatL2(embeddings_array.shape[1])
    idx.add(embeddings_array)
    faiss.write_index(idx, index_file)
    
    with open(mapping_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['chunk', 'source', 'category'])
        for c, s, cat in zip(chunks, sources, categories):
            writer.writerow([c, s, cat])
    
    print(f"Built index with {len(chunks)} chunks.")

def get_product_details(no: str) -> dict:
    BASE_URL = os.getenv("BC_API_BASE_URL")
    API_USERNAME = os.getenv("BC_API_USERNAME")
    API_PASSWORD = os.getenv("BC_API_PASSWORD")
    params = {"$filter": f"No eq '{no}'"}
    try:
        response = requests.get(
            BASE_URL,
            params=params,
            auth=HTTPBasicAuth(API_USERNAME, API_PASSWORD)
        )
        response.raise_for_status()
        data = response.json()
        if 'value' in data and data['value']:
            item = data['value'][0]
            return {
                'no': item.get('No', ''),
                'inventory': int(item.get('Inventory', 0)),
                'unit_price': float(item.get('Unit_Price', 0)),
                'description': item.get('Description', ''),
                'item_category_code': item.get('Item_Category_Code', ''),
                'product_model': item.get('Product_Model', ''),
                'specifications': item.get('Technical_Specifications', ''),
                'warranty': item.get('Warranty_Period', '')
            }
        return {}
    except requests.RequestException as e:
        print(f"Error fetching product details: {str(e)}")
        return {}

def enrich_recommendation_with_erp(recommendation: Recommendation) -> dict:
    def enrich_product(product):
        details = get_product_details(product.model_number)
        enriched = {
            'product_name': product.product_name,
            'model_number': product.model_number,
            'product_description': product.product_description,
        }
        if details:
            enriched.update(details)
        return enriched
    return {
        'pretreatment': [enrich_product(p) for p in recommendation.pretreatment],
        'RO': [enrich_product(p) for p in recommendation.RO],
        'postreatment': [enrich_product(p) for p in recommendation.postreatment],
    }

# Example usage for backend integration (not for CLI use)
if __name__ == "__main__":
    # Use the PDF lab report for testing
    pdf_path = "uploads/Lab report.pdf"
    
    # Step 1: Extract text from the PDF lab report
    lab_report_text = extract_lab_report_from_pdf(pdf_path)
    
    if lab_report_text:
        print("Successfully extracted text from PDF lab report")
        
        # Step 2: Convert the text to JSON
        lab_json = convert_lab_report_to_json(lab_report_text)
        
        if lab_json:
            print("Successfully converted lab report to JSON")
            
            # Step 3: Process the lab report and a sample user query
            test_user_query = "Design a water treatment system for a bottling plant, 500 L/hr."
            result = process_lab_report_and_query(lab_json, test_user_query)
            
            print("RAG Processing completed. Results:")
            print(json.dumps(result, indent=2))
        else:
            print("Failed to convert lab report to JSON")
    else:
        print("Failed to extract text from PDF lab report")
        # Fallback to test JSON if PDF extraction fails
        test_lab_json = json.dumps({
            "ph": 7.2,
            "tds": 1200,
            "hardness": 320,
            "iron": 0.5,
            "manganese": 0.15,
            "silica": 12,
            "turbidity": 4.5,
            "sample_date": "2025-04-28"
        })
        test_user_query = "Design a water treatment system for a bottling plant, 500 L/hr."
        result = process_lab_report_and_query(test_lab_json, test_user_query)
        print("Used fallback test data. Results:")
        print(json.dumps(result, indent=2))
