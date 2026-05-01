"""backend/app.py
Flask API server for the Phishing Email Detector extension.
Provides a /predict endpoint that accepts email text and returns phishing detection verdict.
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent directory to path so we can import src modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.predict import predict

app = Flask(__name__)

# Enable CORS for all routes (allow requests from extension and development tools)
CORS(app)


@app.route('/predict', methods=['POST'])
def predict_endpoint():
    """
    POST endpoint: /predict
    
    Request body (JSON):
        {
            "email_text": "The full email body text to analyze"
        }
    
    Response (JSON):
        {
            "label": "Phishing" | "Legitimate",
            "confidence": 85.3,  # percentage (0-100)
            "features": {
                "url_count": 2,
                "has_http_only": 0,
                "suspicious_url_keywords": 1,
                "urgent_keyword_count": 3,
                "has_ip_url": 0,
                "exclamation_count": 5,
                "has_form_tag": 0,
                "link_to_text_ratio": 0.15
            }
        }
    
    Error responses:
        400 Bad Request: Missing or invalid email_text
        500 Internal Server Error: Model prediction failed
    """
    try:
        # Validate request has JSON body
        if not request.is_json:
            return jsonify({
                'error': 'Request must have Content-Type: application/json'
            }), 400
        
        data = request.get_json()
        email_text = data.get('email_text')
        
        # Validate email_text field exists and is not empty
        if not email_text or not isinstance(email_text, str):
            return jsonify({
                'error': 'Missing or invalid "email_text" field in request body'
            }), 400
        
        # Call the predict function from src/predict.py
        result = predict(email_text)
        
        # Return the result (already has label, confidence, features)
        return jsonify(result), 200
    
    except FileNotFoundError as e:
        # Model file not found
        return jsonify({
            'error': f'Model file not found. Have you trained the model? Details: {str(e)}'
        }), 500
    except Exception as e:
        # Any other error during prediction
        return jsonify({
            'error': f'Prediction failed: {str(e)}'
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Phishing Email Detector Backend Server")
    print("="*70)
    print("\nFlask server running at: http://127.0.0.1:5000")
    print("API endpoint: POST http://127.0.0.1:5000/predict")
    print("Health check: GET http://127.0.0.1:5000/health")
    print("\nCORS enabled for all origins (extension, curl, Postman, etc.)")
    print("\nPress Ctrl+C to stop the server.\n")
    print("="*70 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)

