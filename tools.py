from dotenv import load_dotenv
load_dotenv()
import os
import requests
from requests.auth import HTTPBasicAuth
import logging
from typing import Dict

logger = logging.getLogger(__name__)

BC_API_BASE_URL = os.getenv("BC_API_BASE_URL")
BC_API_USERNAME = os.getenv("BC_API_USERNAME")
BC_API_PASSWORD = os.getenv("BC_API_PASSWORD")


def get_product_details(no: str) -> Dict:
    """Fetch comprehensive product details from ERP/Business Central API."""
    params = {"$filter": f"No eq '{no}'"}
    try:
        response = requests.get(
            BC_API_BASE_URL,
            params=params,
            auth=HTTPBasicAuth(BC_API_USERNAME, BC_API_PASSWORD)
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
        logger.error(f"Error fetching product details for {no}: {str(e)}")
        return {}
