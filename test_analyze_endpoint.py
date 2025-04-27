import requests
import json

def test_analyze():
    url = "http://localhost:8000/analyze"
    payload = {
        "tds": 800,
        "ph": 7.2,
        "hardness": 250,
        "alkalinity": 120,
        "location": "Nairobi",
        "use_case": "drinking",
        "industry": "commercial",
        "daily_demand": 5,
        "quotation": {
            "items": [
                {
                    "name": "DOW FILMTEC BW30-400",
                    "model": "DOW FILMTEC BW30-400",
                    "unit_price": 0,
                    "quantity": 2,
                    "total_price": 0
                },
                {
                    "name": "GRUNDFOS CR 10-8",
                    "model": "GRUNDFOS CR 10-8",
                    "unit_price": 0,
                    "quantity": 1,
                    "total_price": 0
                }
            ],
            "total": 0
        }
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print("Response Text:", response.text)

def main():
    test_analyze()

if __name__ == "__main__":
    main()
