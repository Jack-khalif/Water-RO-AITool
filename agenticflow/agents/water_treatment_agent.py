"""
Water Treatment Analysis Agent

This module implements an agentic workflow for water treatment lab analysis and RO system design.
It analyzes water lab reports and generates three design proposals (Economy, Standard, Premium).
"""

import os
import json
from typing import Dict, Any
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_water_report(lab_report: str, user_requirements: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze water lab report and generate three design proposals
    
    Args:
        lab_report: The water analysis lab report text
        user_requirements: User requirements including flow rate, application, etc.
        
    Returns:
        Three design proposals (economy, standard, premium) for the water treatment system
    """
    # Create the prompt
    prompt = f"""
    You are a water treatment expert. Analyze this water lab report and generate three design proposals.
    
    Lab Report:
    {lab_report}
    
    User Requirements:
    {json.dumps(user_requirements, indent=2)}
    
    Generate three different design proposals:
    1. ECONOMY: A budget-friendly solution with essential components
    2. STANDARD: A balanced solution with good performance and value
    3. PREMIUM: A high-end solution with advanced features
    
    For each proposal, include:
    - Water parameters extracted from the lab report
    - System model name
    - Brief description
    - Pretreatment details (oxidation, pH adjustment, filter type, media)
    - RO system specifications (capacity, recovery rate, membrane type, etc.)
    - Cost estimates (equipment, installation, commissioning, total)
    - Delivery time
    - Warranty details
    - Maintenance schedule
    
    Format your response as a JSON object with the following keys:
    - water_parameters: The extracted water parameters
    - economy: The economy proposal
    - standard: The standard proposal
    - premium: The premium proposal
    
    Ensure all required fields are included in each proposal.
    """
    
    # Call the OpenAI API
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a water treatment expert specialized in RO system design."},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )
    
    # Parse the JSON response
    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response content: {response.choices[0].message.content}")
        raise

if __name__ == "__main__":
    # This code runs when the script is executed directly
    print("Water Treatment Agent module loaded successfully.")
    print("Use the analyze_water_report function to generate design proposals.")
