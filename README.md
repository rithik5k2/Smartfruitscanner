# 🍎 FruitScanner Pro — AI Fruit Ripeness Detection

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![OpenCV](https://img.shields.io/badge/Vision-OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=black)

FruitScanner Pro is a **full-stack computer vision web app** that detects fruit ripeness in real-time using **OpenCV HSV color analysis**.

Point your camera at a fruit — or upload a photo — and get an instant ripeness reading with confidence score.

---

## 🌐 Live Demo

| | Link |
|---|---|
| 🖥 **Live App** | https://smartfruitscanner.vercel.app |
| ⚙️ **Backend API** | https://smartfruitscanner.onrender.com |
| 💚 **Health Check** | https://smartfruitscanner.onrender.com/api/health |

---

## ✨ Features

- 📷 **Live webcam detection** — real-time ripeness scanning at 600ms intervals
- 🖼 **Photo upload analysis** — drag-and-drop or browse any image
- 🧠 **OpenCV HSV color analysis** — no ML model required, fast and lightweight
- 📊 **Confidence scoring** — percentage breakdown of red / amber / green color distribution
- 🎯 **Scan zone overlay** — visual HUD guides fruit placement
- 📱 **Responsive design** — works on desktop and mobile

---

## 🔧 How It Works

```
User Camera / Uploaded Image
         ↓
  React Frontend (Vercel)
         ↓
  POST /api/analyse  (base64 image)
         ↓
  FastAPI Backend (Render)
         ↓
  OpenCV: RGB → HSV Conversion
         ↓
  Color Masking → Pixel Ratio
         ↓
  Ripeness Classification (JSON)
         ↓
  Displayed on UI with overlay
```

---

## 🍌 Ripeness Detection Logic

Images are converted from **RGB → HSV color space**. Pixel ratios across color ranges determine ripeness.

| Dominant Color | Ripeness | Meaning |
|---|---|---|
| 🔴 Red | Ripe | Ready to eat |
| 🟡 Yellow / Amber | Semi-Ripe | 1–2 days to peak |
| 🟢 Green | Unripe | Needs more time |

**Pipeline:**
```
Image → HSV Conversion → Color Masking → Pixel % → Ripeness + Confidence
```

---

## ⚙️ Tech Stack

**Frontend**
- React.js
- HTML5 Canvas API (frame capture)
- Web Camera API (`getUserMedia`)
- CSS animations

**Backend**
- FastAPI (Python)
- OpenCV (`cv2`)
- NumPy

**Deployment**
- Frontend → **Vercel**
- Backend → **Render**

---

## 📁 Project Structure

```
smartfruitscanner/
│
├── backend/
│   ├── main.py           ← FastAPI server + /api/analyse endpoint
│   ├── analyzer.py       ← OpenCV HSV analysis logic
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       └── components/
│           ├── Menu.js           ← Launch screen
│           ├── LiveAnalyzer.js   ← Webcam mode
│           ├── PhotoAnalyzer.js  ← Photo upload mode
│           └── ResultPanel.js    ← Results display
│
└── README.md
```

---

## 🌍 Deployment Architecture

```
User Browser
     ↓
Vercel  (React — Static Frontend)
     ↓  POST /api/analyse
Render  (FastAPI — Python Backend)
     ↓
OpenCV Image Processing
```

---

## ⚠️ Note on Cold Starts

The backend runs on **Render's free tier**, which spins down after inactivity.  
The **first request may take 20–30 seconds** to wake the server. Subsequent requests are fast.

---

## 🔮 Future Improvements

- 🤖 CNN-based ripeness model for higher accuracy
- 🍇 Multi-fruit detection in a single frame
- 📱 Native mobile camera optimization
- 🏷 Fruit type classification (banana vs apple vs mango)
- 📈 Historical ripeness trend tracking

---

## 👨‍💻 Author

**Rithik Rao**  
GitHub: [@rithik5k2](https://github.com/rithik5k2)