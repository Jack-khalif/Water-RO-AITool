import os
from datetime import datetime

from jinja2 import Template

# Load the HTML template
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "proposal_template.html")

def render_proposal(context):
    """
    Render the proposal HTML with the provided context.
    context: dict with keys matching placeholders in proposal_template.html
    Returns: rendered HTML string
    """
    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        template = Template(f.read())
    return template.render(**context)

# Example usage (remove or modify for integration into your pipeline)
if __name__ == "__main__":
    # Dummy data for demonstration
    context = {
        "header_image": "header.png",
        "proposal_number": "CO/DND/WTS/0454165",
        "date": datetime.now().strftime("%d %B, %Y"),
        "client_name": "John Makau",
        "capacity": "250 litres/hr",
        "lab_sample_id": "10/24/RO/2376",
        "lab_sample_date": "10th October, 2024",
        "parameter_table": "<table><tr><td>pH</td><td>6.13</td></tr></table>",
        "flow_rate": "0.25 m³/hr",
        "treatment_layout_image": "layout.png",
        "equipment_image": "equipment.png",
        "dsl_scope": "<ul><li>Fabrication and assembly of equipment.</li></ul>",
        "client_scope": "<ul><li>Provide a well-ventilated plant room.</li></ul>",
        "pricing_table": "<table><tr><td>SUPPLY & INSTALLATION OF A WATER TREATMENT PLANT -250 LIT/HR</td><td>1</td><td>1,532,550</td></tr></table>",
        "footer_image": "footer.jpg"
    }
    html = render_proposal(context)
    # Save or return html as needed
    with open("generated_proposal.html", "w", encoding="utf-8") as out:
        out.write(html)
    print("Proposal generated as generated_proposal.html")
