from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

API_KEY = "38a4d1f178cb3d02c00916cf"
BASE_URL = f"https://v6.exchangerate-api.com/v6/{API_KEY}"

@app.route('/')
def main():
    return '1'

@app.route('/rate/<from_currency>/<to_currency>', methods=['GET'])
def get_exchange_rate(from_currency, to_currency):
    print(from_currency, to_currency)
    if not from_currency or not to_currency:
        return jsonify({"error": "Please provide both 'from' and 'to' currency codes"}), 400

    try:
        print(f"{BASE_URL}/pair/{from_currency}/{to_currency}")
        response = requests.get(f"{BASE_URL}/pair/{from_currency}/{to_currency}")
        data = response.json()
        print(data)
        if data['result'] == 'success':
            rate = data['conversion_rate']
            return jsonify({
                "from": from_currency,
                "to": to_currency,
                "rate": rate
            })
        else:
            return jsonify({"error": "Failed to fetch exchange rate"}), 500
    
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)