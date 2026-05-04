# 🛡️ PhishShield
### *Next-Gen Phishing Detection Powered by Machine Learning*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg)](https://fastapi.tiangolo.com/)

**PhishShield** is a high-performance Chrome Extension designed to protect users from sophisticated phishing attacks in real-time. By combining a lightweight frontend with a robust **XGBoost Machine Learning model**, PhishShield analyzes URL structures and behavioral patterns to stop cyber threats before they reach the user.

---

## 🚀 Key Features

- **🧠 Advanced ML Engine:** Powered by an optimized XGBoost model achieving **98.5% accuracy** in detecting malicious patterns.
- **⚡ Real-Time Protection:** Instant URL analysis as you browse, ensuring seamless security without slowing down your experience.
- **🛡️ Shadow DOM UI:** A resilient, non-intrusive warning system injected via Shadow DOM to prevent website styles from breaking the security UI.
- **🔍 Typosquatting Detection:** Built-in Levenshtein algorithms to detect "look-alike" domains (e.g., `googIe.com` vs `google.com`).
- **🔐 Privacy First:** No personal browsing data is stored. Analysis is performed on-the-fly via a secure REST API.
- **📈 Scan History:** Keep track of your safety with a local history dashboard and visual safety scores.

---

## 🛠️ Tech Stack

- **Machine Learning:** XGBoost, Scikit-learn, Pandas (Feature Engineering)
- **Backend:** Python, FastAPI, Uvicorn (REST API)
- **Frontend:** JavaScript (Chrome Extension API V3), HTML5, CSS3
- **DevOps/Tools:** Joblib, Render (Deployment), Git

---

## 📂 Architecture

```text
PhishShield/
├── 📁 Frontend/          # Chrome Extension V3
│   ├── background.js     # URL interception & ML API caller
│   ├── manifest.json     # Extension configuration
│   └── popup.js          # Security dashboard UI
└── 📁 backend/           # ML Inference Server
    ├── app.py            # FastAPI Application
    ├── url_feature_extractor.py # 30+ Feature extraction logic
    └── xgb_model.json    # Pre-trained XGBoost Model
```

---

## 🧪 How It Works

1. **Interception:** The extension monitors `webNavigation` events.
2. **Feature Extraction:** 30+ features are extracted from the URL (length, special characters, prefix/suffix, etc.).
3. **Inference:** Features are sent to the FastAPI backend hosted on Render.
4. **Verdict:** The XGBoost model returns a probability score.
5. **Enforcement:** If malicious, a high-visibility warning is injected into the page, allowing the user to exit safely.

---

## ⚙️ Installation & Setup

### For Users
1. **Download** this repository as a ZIP and extract it.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** (top right toggle).
4. Click **"Load unpacked"** and select the `Frontend` folder.
5. **Pin PhishShield** to your toolbar for easy access!

### For Developers (Local Backend)
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the server: `python app.py`.
4. Update the API URL in `Frontend/background.js` to `http://localhost:8000`.

---

## 🔬 Research & Innovation
PhishShield represents a paradigm shift in browser security, moving away from static, reactive blacklists toward **proactive, AI-driven behavioral analysis**. Developed as a specialized research initiative by **Sanobar Shaikh**, this project bridges the gap between high-complexity Machine Learning models and practical, user-centric cybersecurity tools.

### 🗺️ Future Roadmap
- [ ] **Heuristic DOM Analysis:** Identifying deceptive UI elements and "fake" login forms in real-time.
- [ ] **Multi-Model Ensemble:** Integrating CNNs (Convolutional Neural Networks) for visual phishing detection.
- [ ] **Global Threat Intelligence:** Creating a decentralized peer-to-peer network for instant sharing of newly detected phishing nodes.

---

## 🤝 Connect & Collaborate
I am passionate about the intersection of Machine Learning and Cybersecurity. If you're interested in my work, have suggestions, or want to collaborate on future security projects, let's connect!

- **GitHub:** [@Sanobar22](https://github.com/Sanobar22)
- **LinkedIn:** (https://www.linkedin.com/in/sanobar-shaikh-76574527b)
- **Email:** [ssanobar732@gmail.com]

---

<p align="center">
  <i>"Securing the web, one byte at a time."</i><br>
</p>
*Disclaimer: No security tool is 100% foolproof. Always practice safe browsing habits.*
