# 🍎 FruitScanner Pro — Full-Stack Web App

Real-time and photo-based fruit ripeness detection.
**Python (Flask) backend + React frontend.**

---

## 📁 Project Structure

```
fruitscanner-pro/
├── backend/
│   ├── app.py          ← Flask server (API)
│   ├── analyzer.py     ← OpenCV analysis logic
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js              ← React entry point
    │   ├── App.js                ← Page router
    │   ├── App.css               ← Global styles
    │   └── components/
    │       ├── Menu.js           ← Launch screen
    │       ├── Menu.css
    │       ├── LiveAnalyzer.js   ← Webcam mode
    │       ├── LiveAnalyzer.css
    │       ├── PhotoAnalyzer.js  ← Photo upload mode
    │       ├── PhotoAnalyzer.css
    │       ├── ResultPanel.js    ← Shared results panel
    │       └── ResultPanel.css
    └── package.json
```

---

## 🚀 Setup & Run

### Step 1 — Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2 — Start the Python backend

```bash
python app.py
```

You should see:
```
FruitScanner Pro — Backend Server
Running at: http://localhost:5000
```

### Step 3 — Install React dependencies (first time only)

Open a **new terminal window**, then:

```bash
cd frontend
npm install
```

### Step 4 — Start the React frontend

```bash
npm start
```

Browser opens automatically at **http://localhost:3000**

---

## 🔧 How It Works

```
Browser (React)                  Python (Flask)
───────────────                  ──────────────
[Webcam frame]  ──POST /api/analyse──►  [Decode base64]
[Photo upload]                          [OpenCV HSV analysis]
                ◄──JSON result────────  [Return ripeness data]
[Show result overlay + panel]
```

1. **Live mode**: React captures webcam frames every 350ms via Canvas API, converts to base64, sends to Flask
2. **Photo mode**: React reads uploaded file as base64 via FileReader API, sends to Flask
3. **Flask** decodes the base64 image with OpenCV, runs HSV colour analysis, returns JSON
4. **React** displays the result with animated HUD overlays

---

## 🛑 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Backend offline" | Make sure `python app.py` is running |
| "Camera access denied" | Allow camera in browser permissions |
| CORS error | Check `flask-cors` is installed |
| Module not found | Run `pip install -r requirements.txt` again |
