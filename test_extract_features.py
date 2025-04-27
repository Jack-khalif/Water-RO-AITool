import requests

def test_extract_features(pdf_path):
    url = "http://localhost:8000/extract-features"
    with open(pdf_path, "rb") as f:
        files = {"report": f}
        response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    try:
        print("Extracted JSON:\n", response.json())
    except Exception as e:
        print("Response Text:\n", response.text)

if __name__ == "__main__":
    # Replace with your own lab report PDF path
    test_extract_features("reference_docs/JOHN MAKAU WATER ANALYSIS REPORT.pdf")
