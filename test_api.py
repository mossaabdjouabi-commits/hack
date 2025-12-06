import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_endpoints():
    print("🔍 Testing AgroX API Endpoints...")
    print("="*60)
    
    # 1. Test health endpoint
    print("\n1. Testing /api/health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 2. Test examples endpoint
    print("\n2. Testing /api/examples...")
    try:
        response = requests.get(f"{BASE_URL}/examples")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Examples: {list(data['examples'].keys())}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 3. Test statistics endpoint
    print("\n3. Testing /api/statistics...")
    try:
        response = requests.get(f"{BASE_URL}/statistics")
        print(f"   Status: {response.status_code}")
        stats = response.json()['statistics']
        print(f"   Accuracy: {stats.get('accuracy', 'N/A')}%")
        print(f"   Model loaded: {stats.get('model_loaded', False)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 4. Test regions endpoint
    print("\n4. Testing /api/regions...")
    try:
        response = requests.get(f"{BASE_URL}/regions")
        print(f"   Status: {response.status_code}")
        regions = response.json()['regions']
        print(f"   Regions: {list(regions.keys())}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 5. Test prediction endpoint
    print("\n5. Testing /api/predict...")
    try:
        test_data = {
            "plantType": "tree",
            "lifespan": "perennial",
            "woodiness": "1",
            "drought_tolerance": 90,
            "salinity_tolerance": 85,
            "region": "sahara"
        }
        
        response = requests.post(
            f"{BASE_URL}/predict",
            headers={"Content-Type": "application/json"},
            json=test_data
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            pred = result['prediction']
            print(f"   Success: {pred['success']}")
            print(f"   Confidence: {pred['confidence']}%")
            print(f"   Recommendations: {len(result.get('recommendations', []))}")
        else:
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # 6. Test charts endpoint
    print("\n6. Testing /api/charts...")
    try:
        response = requests.get(f"{BASE_URL}/charts")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            charts = response.json()['charts']
            print(f"   Charts available: {list(charts.keys())}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "="*60)
    print("✅ API Testing Complete!")

if __name__ == "__main__":
    test_endpoints()