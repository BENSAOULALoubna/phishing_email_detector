import joblib, os
from src.feature_extractor import extract_features

def predict(text):
    model_path = os.path.join(os.path.dirname(__file__), '..', 'outputs', 'model.pkl')
    model = joblib.load(model_path)
    vec, manual = extract_features(text)
    vec = vec.reshape(1, -1)
    label_int = model.predict(vec)[0]
    confidence = round(model.predict_proba(vec).max() * 100, 1)
    return {
        'label': 'Phishing' if label_int == 1 else 'Legitimate',
        'confidence': confidence,
        'features': manual
    }
