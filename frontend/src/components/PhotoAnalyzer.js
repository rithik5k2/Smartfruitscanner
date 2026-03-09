/**
 * PhotoAnalyzer.js  —  Photo Upload & Analysis
 * ----------------------------------------------
 * Lets the user pick an image file (or drag-and-drop one),
 * sends it to the Python backend for analysis, and displays results.
 *
 * Flow:
 *   User picks file → read as base64 → POST to /api/analyse
 *   → display result overlay on the image + ResultPanel
 *
 * Props:
 *   onBack()       — go back to main menu
 *   onSwitchLive() — switch to live camera mode
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import ResultPanel from "./ResultPanel";
import "./LiveAnalyzer.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ANALYSIS_INTERVAL_MS = 350;

export default function PhotoAnalyzer({ onBack, onSwitchLive }) {
  const [imageDataUrl, setImageDataUrl] = useState(null); // the image to display
  const [result, setResult] = useState(null); // analysis result from backend
  const [loading, setLoading] = useState(false); // spinner while waiting for response
  const [error, setError] = useState(null); // error message
  const [dragOver, setDragOver] = useState(false); // is user dragging a file onto the zone?
  const [elapsed, setElapsed] = useState(0);
  const [time, setTime] = useState(new Date());

  const fileInputRef = useRef(null); // hidden file input
  const elapsedStart = useRef(null);

  // ── Clock & elapsed timer ────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
      if (elapsedStart.current) {
        setElapsed((Date.now() - elapsedStart.current) / 1000);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" || e.key === "q") onBack();
      if (e.key === "l" || e.key === "L") onSwitchLive();
      if (e.key === "p" || e.key === "P") fileInputRef.current?.click();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, onSwitchLive]);

  /**
   * handleFile(file)
   * Given a File object (from input or drag-and-drop):
   *   1. Read it as a base64 data URL using FileReader
   *   2. Show the image preview
   *   3. Send to backend for analysis
   */
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP, BMP)");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    // FileReader converts the file to a base64 data URL string
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result; // "data:image/jpeg;base64,..."
      setImageDataUrl(dataUrl); // show image preview

      try {
        // ── Send image to Flask backend ──────────────────
        const res = await fetch(`${API_URL}/api/analyse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        setResult(data);
        elapsedStart.current = Date.now();
        setElapsed(0);
      } catch (err) {
        setError(`Analysis failed: ${err.message}. Is the backend running?`);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setLoading(false);
    };

    reader.readAsDataURL(file); // triggers onload above
  }, []);

  // ── Drag and drop handlers ───────────────────────────────
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── File input change ────────────────────────────────────
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset so same file can be picked again
  };

  const ripenessClass = result ? getRipenessClass(result.ripeness) : "";

  return (
    <div className="analyzer-root">
      {/* ── Top HUD bar ──────────────────────────────────── */}
      <div className="hud-bar">
        <span className="brand">FruitScanner Pro</span>
        <span className="separator">|</span>
        <span className="mode-tag" style={{ color: "var(--semi)" }}>
          PHOTO ANALYSIS
        </span>
        <span className="clock">{time.toTimeString().slice(0, 8)}</span>
      </div>

      {/* ── Main layout ──────────────────────────────────── */}
      <div className="analyzer-body">
        {/* ── Left: image display or drop zone ─────────── */}
        <div className="feed-area">
          {/* Hidden file input — triggered by clicking the button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          {imageDataUrl ? (
            /* ── Image preview + overlay ───────────────── */
            <div className="photo-display">
              <img
                src={imageDataUrl}
                alt="Analysed fruit"
                className="photo-img"
              />

              {/* Scan zone overlay on the photo */}
              <div className={`scan-zone ${ripenessClass}`}>
                <div className="scan-zone-label">[ SCAN ZONE ]</div>
                {loading && <div className="scan-line" />}
                <Corner pos="tl" />
                <Corner pos="tr" />
                <Corner pos="bl" />
                <Corner pos="br" />
              </div>

              {/* Loading spinner while backend processes */}
              {loading && (
                <div className="photo-loading-overlay">
                  <div className="spinner" />
                  <span>Analysing…</span>
                </div>
              )}

              {/* Error banner */}
              {error && <div className="photo-error-banner">{error}</div>}

              {/* "Choose new photo" button */}
              <button
                className="btn change-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                ⊡ Choose New Photo
              </button>
            </div>
          ) : (
            /* ── Drop zone (shown before any image is loaded) ── */
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">⊡</div>
              <div className="drop-title">Drop an image here</div>
              <div className="drop-sub">or click to browse files</div>
              <div className="drop-formats">JPG · PNG · WEBP · BMP</div>
              {error && <div className="drop-error">{error}</div>}
            </div>
          )}
        </div>

        {/* ── Right: results panel ─────────────────────── */}
        <ResultPanel
          result={result}
          mode="PHOTO"
          elapsed={result ? elapsed : undefined}
        />
      </div>

      {/* ── Bottom hint bar ───────────────────────────────── */}
      <div className="hint-bar">
        <span>
          <kbd>P</kbd> New photo
        </span>
        <span>
          <kbd>L</kbd> Live mode
        </span>
        <span>
          <kbd>ESC</kbd> Menu
        </span>
      </div>
    </div>
  );
}

function Corner({ pos }) {
  return <div className={`corner corner-${pos}`} />;
}

function getRipenessClass(ripeness) {
  return (
    {
      Ripe: "zone-ripe",
      "Semi-Ripe": "zone-semi",
      Unripe: "zone-unripe",
      "No Fruit": "zone-none",
    }[ripeness] || ""
  );
}
