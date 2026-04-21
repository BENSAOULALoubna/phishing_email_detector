# Phishing Email Detector

A machine learning-powered Chrome extension that scans emails in Gmail and detects phishing attempts in real time. The user opens any email, clicks **"Scan Email"**, and instantly sees a verdict with a confidence score and a breakdown of suspicious indicators — all without leaving Gmail.

---

## How It Works

1. The Chrome extension injects a **"Scan Email"** button into the Gmail interface
2. Clicking it extracts the email text from the Gmail DOM
3. The text is sent to a local Flask server via a POST request
4. The server runs the email through the trained ML model
5. The result appears as an overlay panel directly inside Gmail

---

## Project Structure

```
phishing-detector/
├── data/
│   ├── raw/
│   │   ├── easy_ham/          # Legitimate emails (SpamAssassin corpus)
│   │   ├── spam/              # Spam/phishing emails (SpamAssassin corpus)
│   │   ├── ham.tar.bz2
│   │   └── spam.tar.bz2
│   └── emails.csv             # Cleaned dataset (generated)
│
├── notebooks/
│   ├── 01_data_preparation.ipynb     # Download & parse dataset → emails.csv
│   ├── 02_feature_engineering.ipynb  # Feature extraction & TF-IDF → vectorizer.pkl
│   ├── 03_model_training.ipynb       # Train & evaluate models → model.pkl
│   └── 04_demo_interface.ipynb       # In-notebook interactive demo
│
├── src/
│   ├── feature_extractor.py   # Shared module: extract_features()
│   └── predict.py             # Shared module: predict()
│
├── backend/
│   └── app.py                 # Flask API server (/predict endpoint)
│
├── extension/
│   ├── manifest.json          # Chrome extension config
│   ├── content.js             # Injected into Gmail: button + result panel
│   ├── popup.html             # Toolbar popup (manual input fallback)
│   ├── popup.js               # Popup logic
│   ├── background.js          # Extension service worker
│   ├── css/
│   │   ├── overlay.css        # Styles for the Gmail result panel
│   │   └── popup.css          # Styles for the popup
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── outputs/
│   ├── model.pkl              # Trained classifier (generated)
│   ├── vectorizer.pkl         # TF-IDF vectorizer (generated)
│   └── evaluation_report.txt  # Model metrics (generated)
│
├── requirements.txt
└── README.md
```

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/phishing-detector.git
cd phishing-detector
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Prepare the dataset

The raw SpamAssassin data is already in `data/raw/`. Run **Notebook 01** to parse and clean it:

```
notebooks/01_data_preparation.ipynb
```

This produces `data/emails.csv`.

### 4. Build the feature extractor and vectorizer

Run **Notebook 02**:

```
notebooks/02_feature_engineering.ipynb
```

This produces `outputs/vectorizer.pkl` and exports `src/feature_extractor.py`.

### 5. Train the model

Run **Notebook 03**:

```
notebooks/03_model_training.ipynb
```

This trains and compares Logistic Regression and Random Forest classifiers, then saves the best one to `outputs/model.pkl` and prints an evaluation report.

### 6. Start the Flask server

```bash
python backend/app.py
```

The server runs on `http://localhost:5000`. It must stay running while using the extension.

### 7. Load the extension in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `extension/` folder
4. The extension icon will appear in the Chrome toolbar

---

## Usage

**In Gmail:**
- Open any email
- Click the **"Scan Email"** button injected into the Gmail toolbar
- The result panel appears above the email body showing the verdict, confidence score, and triggered indicators

**Via the toolbar popup:**
- Click the extension icon in Chrome
- Paste any email text manually and click **Scan**
- Useful for testing without opening Gmail

---

## ML Model

**Dataset:** SpamAssassin Public Corpus — `data/raw/spam/` and `data/raw/easy_ham/`

**Features:** TF-IDF (3000 terms) + 8 handcrafted features:

| Feature | Description |
|---|---|
| `url_count` | Total number of URLs in the email |
| `has_http_only` | Any URL uses HTTP instead of HTTPS |
| `suspicious_url_keywords` | URLs contain words like login, verify, account |
| `urgent_keyword_count` | Count of urgency phrases |
| `has_ip_url` | URL uses a raw IP address instead of a domain |
| `exclamation_count` | Number of `!` characters |
| `has_form_tag` | Email HTML contains `<form>` or `<input>` tags |
| `link_to_text_ratio` | URL count divided by word count |

**Results** (fill in after running Notebook 03):

| Model | Accuracy | F1 Score |
|---|---|---|
| Logistic Regression | — | — |
| Random Forest | — | — |

---

## Requirements

```
flask
flask-cors
scikit-learn
pandas
numpy
joblib
```

---

> **Note:** The Flask server must be running locally for the extension to work. If the extension shows "Could not connect to the detection server", run `python backend/app.py` first.
