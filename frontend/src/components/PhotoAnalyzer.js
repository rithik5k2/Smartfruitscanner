/**
 * PhotoAnalyzer.js — Photo Upload & Analysis
 * Logic 100% unchanged. Markup updated for new design system.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import ResultPanel from "./ResultPanel";
import "./LiveAnalyzer.css";   /* shared layout (analyzer-root, hud-bar etc.) */
import "./PhotoAnalyzer.css";  /* photo-specific styles */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PhotoAnalyzer({ onBack, onSwitchLive }) {
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [time,         setTime]         = useState(new Date());

  const fileInputRef = useRef(null);
  const elapsedStart = useRef(null);

  // ── Clock & elapsed ──────────────────────────────────────
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

  // ── Handle file ──────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP, BMP)");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImageDataUrl(dataUrl);
      try {
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
    reader.onerror = () => { setError("Failed to read file"); setLoading(false); };
    reader.readAsDataURL(file);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
  const onFileChange = (e) => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ""; };

  const ripenessClass = result ? getRipenessClass(result.ripeness) : "";

  return (
    <div className="analyzer-root">

      {/* ── Top HUD bar ──────────────────────────────────── */}
      <header className="hud-bar">
        <div className="hud-left" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span className="brand">FruitScanner Pro</span>
          <span className="hud-divider" aria-hidden="true">|</span>
          <span className="mode-badge" style={{
            color: 'var(--semi)',
            background: 'var(--semi-glow)',
            border: '1px solid rgba(230,126,34,0.25)'
          }}>⊡ Photo</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginLeft:'auto' }}>
          <span className="clock">{time.toTimeString().slice(0, 8)}</span>
          <button className="hud-close-btn" onClick={onBack} aria-label="Back to menu">✕</button>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────── */}
      <div className="analyzer-body">

        {/* Image area */}
        <div className="feed-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
            aria-label="Choose image file"
          />

          {imageDataUrl ? (
            <div className="photo-display">
              <img src={imageDataUrl} alt="Analysed fruit" className="photo-img" />

              <div className={`scan-zone ${ripenessClass}`} role="presentation">
                <div className="scan-zone-label">[ Scan Zone ]</div>
                {loading && <div className="scan-line" aria-hidden="true" />}
                <Corner pos="tl" /><Corner pos="tr" />
                <Corner pos="bl" /><Corner pos="br" />
              </div>

              {loading && (
                <div className="photo-loading-overlay" role="status" aria-live="polite">
                  <div className="spinner" aria-hidden="true" />
                  <span>Analysing image…</span>
                </div>
              )}

              {error && <div className="photo-error-banner" role="alert">{error}</div>}

              <button
                className="btn change-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                ⊡ Choose New Photo
              </button>
            </div>
          ) : (
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="Drop image or click to browse"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="drop-icon" aria-hidden="true">⊡</div>
              <div className="drop-title">Drop an image here</div>
              <div className="drop-sub">or click to browse files</div>
              <div className="drop-formats">JPG · PNG · WEBP · BMP</div>
              {error && <div className="drop-error" role="alert">{error}</div>}
            </div>
          )}
        </div>

        {/* Results panel */}
        <ResultPanel
          result={result}
          mode="PHOTO"
          elapsed={result ? elapsed : undefined}
        />
      </div>

      {/* ── Bottom hint bar ──────────────────────────────── */}
      <footer className="hint-bar">
        <span><kbd>P</kbd> New photo</span>
        <span style={{ color: 'rgba(0,212,170,0.3)', fontSize:'0.5rem', letterSpacing:'0.14em' }}>
          PHOTO ANALYSIS
        </span>
        <span><kbd>L</kbd> Live · <kbd>ESC</kbd> Menu</span>
      </footer>

    </div>
  );
}

function Corner({ pos }) {
  return <div className={`corner corner-${pos}`} aria-hidden="true" />;
}

function getRipenessClass(ripeness) {
  return { "Ripe":"zone-ripe","Semi-Ripe":"zone-semi","Unripe":"zone-unripe","No Fruit":"zone-none" }[ripeness] || "";
}
