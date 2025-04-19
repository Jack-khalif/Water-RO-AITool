"""
Water Treatment Analysis and RO System Design Agent

This module implements an agentic workflow using LangChain and LangGraph to:
1. Analyze water lab reports
2. Determine appropriate pretreatment requirements
3. Size RO systems
4. Generate technical and financial proposals
"""

import os
import json
import base64
from typing import Dict, List, Any, Optional, TypedDict, Annotated, Literal, Union
from pathlib import Path
from io import BytesIO

# LangChain imports
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain.retrievers.ensemble import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# Multimodal imports
#from langchain_openai import OpenAIVisionModel
import pytesseract
from PIL import Image
import cv2
import numpy as np

# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint import JsonCheckpoint

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Set OpenAI API key
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Define models
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
vision_model = OpenAIVisionModel(model="gpt-4-vision-preview")

# Define Pydantic models for structured outputs
class WaterParameters(BaseModel):
    """Water quality parameters from lab analysis"""
    ph: float = Field(..., description="pH value of water")
    tds: float = Field(..., description="Total Dissolved Solids in mg/L")
    hardness: float = Field(..., description="Total Hardness as CaCO3 in mg/L")
    iron: float = Field(..., description="Iron (Fe) concentration in mg/L")
    manganese: float = Field(..., description="Manganese (Mn) concentration in mg/L")
    silica: Optional[float] = Field(None, description="Silica (SiO2) concentration in mg/L")
    turbidity: Optional[float] = Field(None, description="Turbidity in NTU")
    chlorides: Optional[float] = Field(None, description="Chlorides concentration in mg/L")
    sample_date: str = Field(..., description="Date when sample was collected")
    
class PretreatmentRecommendation(BaseModel):
    """Recommended pretreatment based on water parameters"""
    requires_oxidation: bool = Field(..., description="Whether oxidation is required (for Fe/Mn)")
    oxidation_method: Optional[str] = Field(None, description="Recommended oxidation method if required")
    requires_ph_adjustment: bool = Field(..., description="Whether pH adjustment is required")
    ph_adjustment_method: Optional[str] = Field(None, description="Recommended pH adjustment method if required")
    filter_type: str = Field(..., description="Type of filter recommended (e.g., DMI, Multimedia)")
    filter_size: str = Field(..., description="Size of filter recommended based on flow rate")
    media_types: List[str] = Field(..., description="Types of media recommended for filtration")
    
class ROSystemSpec(BaseModel):
    """Specifications for the RO system"""
    capacity: float = Field(..., description="Required capacity in L/hr")
    recovery_rate: float = Field(..., description="Recovery rate as percentage")
    membrane_type: str = Field(..., description="Recommended membrane type")
    membrane_count: int = Field(..., description="Number of membranes required")
    antiscalant_type: str = Field(..., description="Recommended antiscalant type")
    pressure: float = Field(..., description="Operating pressure in bar")
    post_treatment: List[str] = Field(..., description="Recommended post-treatment steps")
    
class CostEstimate(BaseModel):
    """Cost breakdown for the proposed system"""
    equipment_cost: float = Field(..., description="Cost of equipment in USD")
    installation_cost: float = Field(..., description="Cost of installation in USD")
    commissioning_cost: float = Field(..., description="Cost of commissioning in USD")
    total_cost: float = Field(..., description="Total cost in USD")
    
class Proposal(BaseModel):
    """Complete proposal for the water treatment system"""
    system_model: str = Field(..., description="Model name of the proposed system")
    water_parameters: WaterParameters = Field(..., description="Water parameters from analysis")
    pretreatment: PretreatmentRecommendation = Field(..., description="Pretreatment recommendations")
    ro_system: ROSystemSpec = Field(..., description="RO system specifications")
    costs: CostEstimate = Field(..., description="Cost estimates")
    delivery_time: str = Field(..., description="Estimated delivery time")
    warranty: str = Field(..., description="Warranty details")
    maintenance_schedule: List[str] = Field(..., description="Recommended maintenance schedule")
    is_budgetary: bool = Field(..., description="Whether this is a budgetary or final proposal")
    solution_type: str = Field(..., description="Type of solution: economy, standard, or premium")
    description: str = Field(..., description="Brief description of the solution")

class DesignProposals(BaseModel):
    """Container for multiple design proposals"""
    water_parameters: WaterParameters = Field(..., description="Common water parameters for all proposals")
    economy: Proposal = Field(..., description="Economy solution proposal")
    standard: Proposal = Field(..., description="Standard solution proposal")
    premium: Proposal = Field(..., description="Premium solution proposal")

# Define the agent state
class AgentState(TypedDict):
    """State maintained throughout the agent's execution"""
    water_analysis: Optional[Dict[str, Any]]
    user_requirements: Optional[Dict[str, Any]]
    extracted_parameters: Optional[WaterParameters]
    pretreatment_recommendations: Optional[Dict[str, PretreatmentRecommendation]]
    ro_system_specs: Optional[Dict[str, ROSystemSpec]]
    cost_estimates: Optional[Dict[str, CostEstimate]]
    design_proposals: Optional[DesignProposals]
    messages: List[Union[HumanMessage, AIMessage, SystemMessage]]
    next: Optional[str]

# Image processing functions for multimodal capabilities
def process_lab_report_image(image_path):
    """Extract text from lab report images using OCR"""
    try:
        # Read image
        image = Image.open(image_path)
        
        # Preprocess image for better OCR results
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        img_thresh = cv2.threshold(img_gray, 150, 255, cv2.THRESH_BINARY_INV)[1]
        
        # Apply OCR
        extracted_text = pytesseract.image_to_string(img_thresh)
        
        return extracted_text
    except Exception as e:
        return f"Error processing image: {str(e)}"

def analyze_image_with_vision_model(image_path, prompt):
    """Analyze image using the vision model"""
    try:
        # Read and encode image
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")
        
        # Create message with image
        response = vision_model.invoke([
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
        ])
        
        return response.content
    except Exception as e:
        return f"Error analyzing image: {str(e)}"

def extract_parameters_from_image(image_path):
    """Extract water parameters from lab report image"""
    # First try OCR
    ocr_text = process_lab_report_image(image_path)
    
    # Then use vision model to interpret the results
    prompt = """You are a water treatment expert. This is an image of a water analysis lab report.
    Extract all relevant water parameters including pH, TDS, hardness, iron, manganese, silica, etc.
    Format the results as a structured JSON with parameter names as keys and values with their units.
    If you can't determine a value with certainty, indicate it as null."""
    
    vision_analysis = analyze_image_with_vision_model(image_path, prompt)
    
    # Combine OCR and vision model results
    combined_analysis = f"OCR Results:\n{ocr_text}\n\nVision Model Analysis:\n{vision_analysis}"
    
    # Extract structured data using LLM
    extract_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are a water treatment expert. Extract structured water parameters from the provided text and analysis.
        Return the results as a JSON object with parameter names as keys and values with their units."""),
        HumanMessage(content=combined_analysis)
    ])
    
    # Create chain with output parser
    chain = extract_prompt | llm | JsonOutputParser()
    
    # Run the chain
    try:
        parameters = chain.invoke({})
        return parameters
    except Exception as e:
        return {"error": str(e), "ocr_text": ocr_text, "vision_analysis": vision_analysis}

# Initialize the ensemble retriever with FAISS and BM25
def get_retriever():
    # Load existing FAISS index
    embeddings = OpenAIEmbeddings()
    faiss_vectorstore = FAISS.load_local("rag_faiss.index", embeddings, allow_dangerous_deserialization=True)
    faiss_retriever = faiss_vectorstore.as_retriever(search_kwargs={"k": 3})
    
    # Load documents for BM25
    chunks = []
    with open("rag_mapping.csv", "r", encoding="utf-8") as f:
        next(f)  # Skip header
        for line in f:
            chunks.append(line.split(",")[0])
    
    # Create BM25 retriever
    bm25_retriever = BM25Retriever.from_texts(chunks)
    bm25_retriever.k = 3
    
    # Create ensemble retriever
    ensemble_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, faiss_retriever],
        weights=[0.5, 0.5]
    )
    
    return ensemble_retriever

# Define the agent nodes
def extract_water_parameters(state: AgentState) -> AgentState:
    """Extract water parameters from lab report (text or image)"""
    retriever = get_retriever()
    
    # Get relevant context about water parameter interpretation
    query = "How to interpret water analysis parameters for RO system design"
    context_docs = retriever.get_relevant_documents(query)
    context = "\n\n".join([doc.page_content for doc in context_docs])
    
    # Check if we have an image or text report
    if "image_path" in state["water_analysis"]:
        # Process image lab report
        image_path = state["water_analysis"]["image_path"]
        water_parameters = extract_parameters_from_image(image_path)
        
        # Add the image analysis to messages for context
        state["messages"].append(AIMessage(content=f"I've analyzed the lab report image and extracted these parameters: {json.dumps(water_parameters, indent=2)}"))
    else:
        # Process text lab report
        # Create prompt
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=f"""You are a water treatment expert specialized in analyzing lab reports.
Extract all relevant water parameters from the provided lab report.
Use the following context to help with interpretation:
{context}

Output the parameters in a structured format."""),
            MessagesPlaceholder(variable_name="messages"),
        ])
        
        # Create chain with output parser
        chain = prompt | llm | JsonOutputParser()
        
        # Run the chain
        water_parameters = chain.invoke({"messages": state["messages"]})
    
    # Update state
    return {
        **state,
        "extracted_parameters": water_parameters,
        "next": "determine_pretreatment"
    }

def determine_pretreatment(state: AgentState) -> AgentState:
    """Determine appropriate pretreatment options based on water parameters"""
    retriever = get_retriever()
    
    # Get relevant context about pretreatment
    query = "Pretreatment requirements for RO systems based on water parameters"
    context_docs = retriever.get_relevant_documents(query)
    context = "\n\n".join([doc.page_content for doc in context_docs])
    
    # Create prompt for multiple pretreatment options
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=f"""You are a water treatment expert specialized in pretreatment systems.
Based on the provided water parameters, recommend THREE different pretreatment options:
1. ECONOMY: Basic pretreatment with essential components only
2. STANDARD: Balanced pretreatment with good performance and value
3. PREMIUM: High-end pretreatment with advanced features

Consider oxidation needs for iron/manganese, pH adjustment, filter types, and media selection.
Use the following context to help with recommendations:
{context}

Output the recommendations in a structured JSON format with three keys: 'economy', 'standard', and 'premium'.
Each should contain complete pretreatment specifications."""),
        MessagesPlaceholder(variable_name="messages"),
        HumanMessage(content=f"Water parameters: {json.dumps(state['extracted_parameters'])}"),
    ])
    
    # Create chain with output parser
    chain = prompt | llm | JsonOutputParser()
    
    # Run the chain
    pretreatment_options = chain.invoke({"messages": state["messages"]})
    
    # Update state
    return {
        **state,
        "pretreatment_recommendations": pretreatment_options,
        "next": "size_ro_system"
    }

def size_ro_system(state: AgentState) -> AgentState:
    """Size the RO system based on requirements and water parameters with three different options"""
    retriever = get_retriever()
    
    # Get relevant context about RO system sizing
    query = "RO system sizing based on water parameters and flow requirements"
    context_docs = retriever.get_relevant_documents(query)
    context = "\n\n".join([doc.page_content for doc in context_docs])
    
    # Create prompt for multiple RO system options
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=f"""You are a water treatment expert specialized in RO system design.
Based on the provided water parameters, pretreatment recommendations, and user requirements, design THREE different RO systems:
1. ECONOMY: Basic RO system with essential components only, lower recovery rate and pressure
2. STANDARD: Balanced RO system with good performance and value
3. PREMIUM: High-end RO system with advanced features, higher recovery rate, better membranes, and comprehensive post-treatment

Consider membrane type, recovery rate, pressure requirements, and post-treatment needs for each option.
Use the following context to help with sizing:
{context}

Output the RO system specifications in a structured JSON format with three keys: 'economy', 'standard', and 'premium'.
Each should contain complete RO system specifications."""),
        MessagesPlaceholder(variable_name="messages"),
        HumanMessage(content=f"""
Water parameters: {json.dumps(state['extracted_parameters'])}
Pretreatment recommendations: {json.dumps(state['pretreatment_recommendations'])}
User requirements: {json.dumps(state['user_requirements'])}
"""),
    ])
    
    # Create chain with output parser
    chain = prompt | llm | JsonOutputParser()
    
    # Run the chain
    ro_system_options = chain.invoke({"messages": state["messages"]})
    
    # Update state
    return {
        **state,
        "ro_system_specs": ro_system_options,
        "next": "estimate_costs"
    }

def estimate_costs(state: AgentState) -> AgentState:
    """Estimate costs for the proposed systems with three different options"""
    retriever = get_retriever()
    
    # Get relevant context about cost estimation
    query = "Cost estimation for RO systems and pretreatment"
    context_docs = retriever.get_relevant_documents(query)
    context = "\n\n".join([doc.page_content for doc in context_docs])
    
    # Create prompt for multiple cost estimates
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=f"""You are a water treatment expert specialized in cost estimation.
Based on the provided system specifications, estimate the costs for equipment, installation, and commissioning for THREE different options:
1. ECONOMY: Cost estimates for the economy pretreatment and RO system
2. STANDARD: Cost estimates for the standard pretreatment and RO system
3. PREMIUM: Cost estimates for the premium pretreatment and RO system

Use the following context to help with cost estimation:
{context}

Output the cost estimates in a structured JSON format with three keys: 'economy', 'standard', and 'premium'.
Each should contain complete cost estimates including equipment_cost, installation_cost, commissioning_cost, and total_cost."""),
        MessagesPlaceholder(variable_name="messages"),
        HumanMessage(content=f"""
Water parameters: {json.dumps(state['extracted_parameters'])}
Pretreatment recommendations: {json.dumps(state['pretreatment_recommendations'])}
RO system specifications: {json.dumps(state['ro_system_specs'])}
"""),
    ])
    
    # Create chain with output parser
    chain = prompt | llm | JsonOutputParser()
    
    # Run the chain
    cost_options = chain.invoke({"messages": state["messages"]})
    
    # Update state
    return {
        **state,
        "cost_estimates": cost_options,
        "next": "generate_proposal"
    }

def generate_proposal(state: AgentState) -> AgentState:
    """Generate the three design proposals (economy, standard, premium)"""
    retriever = get_retriever()
    
    # Get relevant context about proposal generation
    query = "Water treatment system proposal format and content"
    context_docs = retriever.get_relevant_documents(query)
    context = "\n\n".join([doc.page_content for doc in context_docs])
    
    # Create prompt for generating three proposals
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=f"""You are a water treatment expert specialized in proposal generation.
Based on all the provided information, generate THREE comprehensive proposals for the water treatment system:
1. ECONOMY: A budget-friendly solution with essential components
2. STANDARD: A balanced solution with good performance and value
3. PREMIUM: A high-end solution with advanced features and comprehensive treatment

For each proposal, include:
- System model name
- Brief description of the solution
- Pretreatment details
- RO system specifications
- Cost estimates
- Delivery time
- Warranty details
- Maintenance schedule

Determine if these are budgetary or final proposals based on the age of the water analysis.
Use the following context to help with proposal generation:
{context}

Output the proposals in a structured JSON format with the water parameters and three complete proposals: economy, standard, and premium."""),
        MessagesPlaceholder(variable_name="messages"),
        HumanMessage(content=f"""
Water parameters: {json.dumps(state['extracted_parameters'])}
Pretreatment recommendations: {json.dumps(state['pretreatment_recommendations'])}
RO system specifications: {json.dumps(state['ro_system_specs'])}
Cost estimates: {json.dumps(state['cost_estimates'])}
"""),
    ])
    
    # Create chain with output parser
    chain = prompt | llm | JsonOutputParser()
    
    # Run the chain
    design_proposals = chain.invoke({"messages": state["messages"]})
    
    # Create DesignProposals object
    proposals = {
        "water_parameters": state['extracted_parameters'],
        "economy": design_proposals.get("economy", {}),
        "standard": design_proposals.get("standard", {}),
        "premium": design_proposals.get("premium", {})
    }
    
    # Update state with final proposals and end the workflow
    return {
        **state,
        "design_proposals": proposals,
        "next": END
    }

def router(state: AgentState) -> str:
    """Route to the next node based on the state"""
    return state["next"]

# Build the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("extract_water_parameters", extract_water_parameters)
workflow.add_node("determine_pretreatment", determine_pretreatment)
workflow.add_node("size_ro_system", size_ro_system)
workflow.add_node("estimate_costs", estimate_costs)
workflow.add_node("generate_proposal", generate_proposal)

# Add edges
workflow.add_edge("extract_water_parameters", "determine_pretreatment")
workflow.add_edge("determine_pretreatment", "size_ro_system")
workflow.add_edge("size_ro_system", "estimate_costs")
workflow.add_edge("estimate_costs", "generate_proposal")
workflow.add_edge("generate_proposal", END)

# Set the entry point
workflow.set_entry_point("extract_water_parameters")

# Compile the graph
app = workflow.compile()

# Function to run the agent
def run_water_treatment_agent(lab_report=None, lab_report_image=None, user_requirements: Dict[str, Any] = None) -> DesignProposals:
    """
    Run the water treatment agent workflow with either text or image input
    
    Args:
        lab_report: The water analysis lab report text (optional if image is provided)
        lab_report_image: Path to the water analysis lab report image (optional if text is provided)
        user_requirements: User requirements including flow rate, application, etc.
        
    Returns:
        Three design proposals (economy, standard, premium) for the water treatment system
    """
    if not lab_report and not lab_report_image:
        raise ValueError("Either lab_report text or lab_report_image path must be provided")
    
    if not user_requirements:
        user_requirements = {
            "flow_rate": 250,  # L/hr
            "application": "drinking_water",
            "budget_constraint": "medium",  # low, medium, high
            "space_constraint": "limited",  # limited, moderate, spacious
            "power_availability": "standard",  # limited, standard, high
            "target_tds": 50  # mg/L
        }
    
    # Initialize water analysis based on input type
    water_analysis = {}
    messages = []
    
    if lab_report:
        water_analysis["report"] = lab_report
        messages.append(HumanMessage(content=f"Here is the water analysis lab report:\n\n{lab_report}"))
    elif lab_report_image:
        water_analysis["image_path"] = lab_report_image
        messages.append(HumanMessage(content=f"I've uploaded a water analysis lab report image at {lab_report_image}"))
    
    # Initialize state
    initial_state = {
        "water_analysis": water_analysis,
        "user_requirements": user_requirements,
        "extracted_parameters": None,
        "pretreatment_recommendations": None,
        "ro_system_specs": None,
        "cost_estimates": None,
        "design_proposals": None,
        "messages": messages,
        "next": "extract_water_parameters"
    }
    
    # Run the workflow
    result = app.invoke(initial_state)
    
    # Return the design proposals
    return result["design_proposals"]

# Example usage
if __name__ == "__main__":
    # Sample lab report
    with open("reference_docs/test_water_analysis.txt", "r") as f:
        lab_report = f.read()
    
    # Sample user requirements
    user_requirements = {
        "flow_rate": 250,  # L/hr
        "application": "drinking_water",
        "budget_constraint": "medium",  # low, medium, high
        "space_constraint": "limited",  # limited, moderate, spacious
        "power_availability": "standard",  # limited, standard, high
        "target_tds": 50  # mg/L
    }
    
    # Run the agent
    proposal = run_water_treatment_agent(lab_report, user_requirements)
    
    # Print the proposal
    print(json.dumps(proposal, indent=2))
