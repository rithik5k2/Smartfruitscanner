/**
 * LiveAnalyzer.js — Live Webcam Analyser
 * Logic 100% unchanged. Markup updated to match new CSS structure.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ResultPanel from './ResultPanel';
import './LiveAnalyzer.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const ANALYSIS_INTERVAL_MS = 600;

export default function LiveAnalyzer({ onBack, onSwitchPhoto }) {

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [fps,     setFps]     = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [time,    setTime]    = useState(new Date());

  const lastRipenessRef = useRef(null);
  const elapsedStartRef = useRef(Date.now());

  // ── Start Camera ─────────────────────────────────────────
  useEffect(() => {
    let analysisPollId;
    let fpsPollId;
    let frameCount = 0;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        analysisPollId = setInterval(async () => {
          const frame = captureFrame();
          if (!frame) return;
          frameCount++;
          try {
            const res = await fetch(`${API_URL}/api/analyse`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: frame }),
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setResult(data);
            if (data.ripeness !== lastRipenessRef.current) {
              lastRipenessRef.current = data.ripeness;
              elapsedStartRef.current = Date.now();
            }
          } catch (err) {
            console.error("Analysis error:", err);
          }
        }, ANALYSIS_INTERVAL_MS);

        fpsPollId = setInterval(() => {
          setFps(frameCount);
          frameCount = 0;
        }, 1000);

      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access."
            : `Camera error: ${err.message}`
        );
      }
    }

    startCamera();

    return () => {
      clearInterval(analysisPollId);
      clearInterval(fpsPollId);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Elapsed Timer ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((Date.now() - elapsedStartRef.current) / 1000);
      setTime(new Date());
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Keyboard Shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" || e.key === "q") onBack();
      if (e.key === "p" || e.key === "P") {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        onSwitchPhoto();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, onSwitchPhoto]);

  // ── Capture Frame ─────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.75);
  }, []);

  const borderClass = result ? getRipenessClass(result.ripeness) : "";

  return (
    <div className="analyzer-root">

      {/* ── Top HUD bar ──────────────────────────────────── */}
      <header className="hud-bar">
        <div className="hud-left">
          <span className="hud-dot" aria-hidden="true" />
          <span className="brand">FruitScanner Pro</span>
          <span className="hud-divider" aria-hidden="true">|</span>
          <span className="mode-badge">● Live</span>
        </div>
        <div className="hud-right" style={{ marginLeft: 'auto', display:'flex', alignItems:'center', gap:'10px' }}>
          <span className="clock">{time.toTimeString().slice(0, 8)}</span>
          <button className="hud-close-btn" onClick={onBack} aria-label="Back to menu">✕</button>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────── */}
      <div className="analyzer-body">

        {/* Camera feed */}
        <div className="feed-area">
          {error ? (
            <div className="feed-error">
              <div className="error-icon" aria-hidden="true">⚠</div>
              <div className="error-msg">{error}</div>
              <button className="btn btn-primary" onClick={onBack}>← Back to Menu</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="live-video" />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className={`scan-zone ${borderClass}`} role="presentation">
                <span className="scan-zone-label">[ Scan Zone ]</span>
                <div className="scan-line" aria-hidden="true" />
                <Corner pos="tl" /><Corner pos="tr" />
                <Corner pos="bl" /><Corner pos="br" />
              </div>
            </>
          )}
        </div>

        {/* Results panel */}
        <ResultPanel
          result={result}
          mode="LIVE"
          fps={fps * Math.round(1000 / ANALYSIS_INTERVAL_MS)}
          elapsed={elapsed}
        />

      </div>

      {/* ── Bottom hint bar ──────────────────────────────── */}
      <footer className="hint-bar">
        <span><kbd>P</kbd> Photo mode</span>
        <span className="hint-center">Hold fruit within the scan zone</span>
        <span><kbd>ESC</kbd> Menu</span>
      </footer>

    </div>
  );
}

function Corner({ pos }) {
  return <div className={`corner corner-${pos}`} aria-hidden="true" />;
}

function getRipenessClass(ripeness) {
  return { "Ripe":"zone-ripe", "Semi-Ripe":"zone-semi", "Unripe":"zone-unripe", "No Fruit":"zone-none" }[ripeness] || "";
}
