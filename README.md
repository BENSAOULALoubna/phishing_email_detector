# Phishing Email Detector

A **Machine Learning–powered Chrome extension** that automatically detects phishing emails in Gmail in real time.

Once installed, the system analyzes every opened email and instantly displays a verdict (**Phishing** or **Legitimate**) along with a confidence score and key indicators — **no user interaction required**.

---

## How It Works

1. The extension detects when an email is opened in Gmail  
2. It automatically extracts the email content  
3. The text is sent to a local Flask backend  
4. A trained ML model analyzes the email  
5. A result banner is injected into Gmail showing:
   - ✅ Legitimate (green)  
   - ❌ Phishing (red)  
   - Confidence score + suspicious indicators  

---

## Machine Learning

- **Dataset:** SpamAssassin Public Corpus  
- **Features:**
  - TF-IDF (text representation)  
  - Heuristic features (URLs, urgency words, etc.)

- **Model used:** Random Forest (selected after comparison)

### Results
- Accuracy: **98.5%**  
- F1-score: **0.979**

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/phishing_email_detector
cd phishing_email_detector
```
### 2. Install dependencies
```
pip install -r requirements.txt
```
### 3. Install the Extension
1- Open Chrome and go to:
```chrome://extensions```
3- Enable Developer mode
4- Click Load unpacked
5- Select the extension/ folder

---

## Usage
1. Open Gmail
2. Open any email
3. The system will automatically analyze it
4. A banner will appear showing the result

---

## Limitations
- Works only on English emails
- Analyzes only text content (no attachments or headers)

---

## Team
- **Ahlem Toubrinet**
- **Loubna Bensaoula**
- **Malak Yasmine Mezigheche**
- **Aimene Boughenama**
- **Dhiaaeddine Zeroual**

---

## ENSIA
*Computer and Network Security Project (2025–2026)*

---

> **Important:** Don't forget to replace `https://github.com/your-username/phishing_email_detector` with your actual GitHub repository URL before committing!