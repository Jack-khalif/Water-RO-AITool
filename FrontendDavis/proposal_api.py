from flask import Flask, request, Response
from generate_proposal import render_proposal
import tempfile

app = Flask(__name__)

@app.route('/api/generate-proposal', methods=['POST'])
def generate_proposal():
    report = request.files['report']
    query = request.form['query']
    # --- Extract data from report (placeholder logic) ---
    # For demo, just use dummy data. Replace with your extraction logic.
    context = {
        "proposal_number": "CO/DND/WTS/0454165",
        "date": "23 April, 2025",
        "client_name": "John Makau",
        "capacity": "250 litres/hr",
        "lab_sample_id": "10/24/RO/2376",
        "lab_sample_date": "10th October, 2024",
        "parameter_table": "<table><tr><td>pH</td><td>6.13</td></tr></table>",
        "flow_rate": "0.25 m³/hr",
        "dsl_scope": "<ul><li>Fabrication and assembly of equipment.</li></ul>",
        "client_scope": "<ul><li>Provide a well-ventilated plant room.</li></ul>",
        "pricing_table": "<table><tr><td>SUPPLY & INSTALLATION OF A WATER TREATMENT PLANT -250 LIT/HR</td><td>1</td><td>1,532,550</td></tr></table>",
        # Images are referenced directly in the template
    }
    # Optionally, use the query for further customization
    context["user_query"] = query
    html = render_proposal(context)
    return Response(html, mimetype='text/html')

if __name__ == "__main__":
    app.run(debug=True)
