"""
main.py — FruitScanner Pro Backend Server (FastAPI Version)

Run with:
    uvicorn main:app --reload --port 5000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import numpy as np
import cv2
import uvicorn
from analyzer import analyse_image


# ── Create FastAPI app ─────────────────────────────
app = FastAPI(title="FruitScanner Pro API")


# ── Enable CORS (for React frontend) ───────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow React localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Schema ─────────────────────────────────
class ImageRequest(BaseModel):
    image: str


# ── Health Check Endpoint ──────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "FruitScanner Pro backend is running"
    }


# ── Main Analysis Endpoint ─────────────────────────
@app.post("/api/analyse")
def analyse(data: ImageRequest):

    try:

        img_string = data.image

        # Remove prefix: data:image/jpeg;base64,
        if "," in img_string:
            img_string = img_string.split(",")[1]

        # Decode base64 → numpy → OpenCV image
        img_bytes = base64.b64decode(img_string)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Could not decode image"}

        # Run your existing analysis
        result = analyse_image(img)

        return result

    except Exception as e:
        print("[ERROR] /api/analyse:", e)
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000)