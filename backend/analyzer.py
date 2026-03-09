"""
analyzer.py
-----------
Pure analysis logic — no Flask here.
Takes an OpenCV image (numpy array) and returns a results dictionary.
Called by app.py for every API request.
"""

import cv2
import numpy as np


def analyse_image(img):
    """
    Given a BGR image (numpy array from OpenCV),
    analyse the CENTRE 70% region for fruit colour/ripeness.

    Returns a dict with:
      - ripeness   : "Ripe" | "Semi-Ripe" | "Unripe" | "No Fruit"
      - red_pct    : float (0–100)  — percentage of red pixels
      - yellow_pct : float (0–100)  — percentage of yellow pixels
      - green_pct  : float (0–100)  — percentage of green pixels
      - confidence : float (0–100)  — how dominant the winning colour is
      - advice     : string tip for the user
    """

    h, w = img.shape[:2]

    # ── 1. Crop the centre 70% of the image as our Region of Interest ──
    #       (ignores background around the fruit)
    y1, y2 = int(h * 0.15), int(h * 0.85)
    x1, x2 = int(w * 0.15), int(w * 0.85)
    roi = img[y1:y2, x1:x2]

    total_pixels = roi.shape[0] * roi.shape[1]
    if total_pixels == 0:
        return _empty_result()

    # ── 2. Convert BGR → HSV ──────────────────────────────────────────
    #       HSV separates "what colour" (Hue) from "how bright" (Value)
    #       making colour detection far more reliable than using BGR
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

    # ── 3. Define colour ranges in HSV ───────────────────────────────
    #       Format: [Hue_min, Sat_min, Val_min], [Hue_max, Sat_max, Val_max]
    #       Hue goes 0-180 in OpenCV (not 0-360)

    # Green: hue 40–85  (lime to deep green)
    lower_green = np.array([40,  70,  70])
    upper_green = np.array([85, 255, 255])

    # Yellow: hue 20–35
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([35, 255, 255])

    # Red wraps around the hue wheel — needs TWO ranges
    lower_red1 = np.array([0,  120,  70])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 120,  70])
    upper_red2 = np.array([180, 255, 255])

    # ── 4. Create binary masks ────────────────────────────────────────
    #       inRange() returns 255 where colour matches, 0 elsewhere
    green_mask  = cv2.inRange(hsv, lower_green,  upper_green)
    yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
    red_mask    = (cv2.inRange(hsv, lower_red1, upper_red1) +
                   cv2.inRange(hsv, lower_red2, upper_red2))

    # ── 5. Noise removal with Morphological Opening ───────────────────
    #       MORPH_OPEN = erode then dilate → removes tiny speckles
    kernel = np.ones((5, 5), np.uint8)
    green_mask  = cv2.morphologyEx(green_mask,  cv2.MORPH_OPEN, kernel)
    yellow_mask = cv2.morphologyEx(yellow_mask, cv2.MORPH_OPEN, kernel)
    red_mask    = cv2.morphologyEx(red_mask,    cv2.MORPH_OPEN, kernel)

    # ── 6. Count matching pixels ──────────────────────────────────────
    r_count = cv2.countNonZero(red_mask)
    y_count = cv2.countNonZero(yellow_mask)
    g_count = cv2.countNonZero(green_mask)

    r_pct = (r_count / total_pixels) * 100
    y_pct = (y_count / total_pixels) * 100
    g_pct = (g_count / total_pixels) * 100

    # ── 7. Decide ripeness ────────────────────────────────────────────
    THRESHOLD = 1.5   # minimum % to count as "detected"

    if   r_pct > y_pct and r_pct > g_pct and r_pct > THRESHOLD:
        ripeness = "Ripe"
        winner   = r_pct
    elif y_pct > r_pct and y_pct > g_pct and y_pct > THRESHOLD:
        ripeness = "Semi-Ripe"
        winner   = y_pct
    elif g_pct > r_pct and g_pct > y_pct and g_pct > THRESHOLD:
        ripeness = "Unripe"
        winner   = g_pct
    else:
        ripeness = "No Fruit"
        winner   = 0.0

    # ── 8. Confidence = how dominant is the winning colour ───────────
    total_colour = r_pct + y_pct + g_pct
    confidence   = (winner / total_colour * 100) if total_colour > 0 else 0.0
    confidence   = min(confidence, 100.0)

    advice_map = {
        "Ripe":      "Ready to eat now!",
        "Semi-Ripe": "1–2 days to peak ripeness",
        "Unripe":    "Needs more time to ripen",
        "No Fruit":  "Place fruit in the scan zone",
    }

    return {
        "ripeness":    ripeness,
        "red_pct":     round(r_pct, 2),
        "yellow_pct":  round(y_pct, 2),
        "green_pct":   round(g_pct, 2),
        "confidence":  round(confidence, 2),
        "advice":      advice_map[ripeness],
    }


def _empty_result():
    return {
        "ripeness":   "No Fruit",
        "red_pct":    0.0,
        "yellow_pct": 0.0,
        "green_pct":  0.0,
        "confidence": 0.0,
        "advice":     "Place fruit in the scan zone",
    }
