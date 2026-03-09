/**
 * LiveAnalyzer.js  —  Live Webcam Analyser
 * -----------------------------------------
 * 1. Asks the browser for webcam access (getUserMedia)
 * 2. Shows the live feed in a <video> element
 * 3. Every 350ms, copies one frame to a hidden <canvas>,
 *    converts it to a base64 JPEG string, and POSTs it to the backend
 * 4. Displays results from the backend in <ResultPanel>
 *
 * Props:
 *   onBack()        — go back to main menu
 *   onSwitchPhoto() — switch to photo mode
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ResultPanel from './ResultPanel';
import './LiveAnalyzer.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// How many milliseconds between each frame sent to the backend
const ANALYSIS_INTERVAL_MS = 350;


export default function LiveAnalyzer({ onBack, onSwitchPhoto }) {
  // useRef lets us directly access DOM elements (video, canvas) without re-rendering
  const videoRef  = useRef(null);   // the <video> element
  const canvasRef = useRef(null);   // hidden <canvas> for frame capture
  const streamRef = useRef(null);   // MediaStream object (so we can stop it later)

  // useState variables trigger re-renders when changed
  const [result,    setResult]    = useState(null);    // latest analysis from backend
  const [error,     setError]     = useState(null);    // error message if something fails
  const [fps,       setFps]       = useState(0);       // frames per second counter
  const [elapsed,   setElapsed]   = useState(0);       // seconds since last ripeness change
  const [time,      setTime]      = useState(new Date());

  // Track when ripeness last changed (for elapsed timer)
  const lastRipenessRef = useRef(null);
  const elapsedStartRef = useRef(Date.now());

  // ── Step 1: Start the webcam ───────────────────────────────
  useEffect(() => {
    let analysisPollId;    // interval ID for frame capture loop
    let fpsPollId;         // interval ID for FPS calculation
    let frameCount = 0;

    async function startCamera() {
      try {
        // Ask browser for webcam access
        // { video: true } means we want video (not audio)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;

        // Attach stream to the <video> element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // ── Step 2: Start capturing frames ─────────────────
        analysisPollId = setInterval(async () => {
          const frame = captureFrame();
          if (!frame) return;

          frameCount++;

          try {
            // ── Step 3: Send frame to Python backend ──────
            const res = await fetch('/api/analyse', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ image: frame }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            // ── Step 4: Update displayed results ──────────
            const data = await res.json();
            setResult(data);

            // Track elapsed time for each stable ripeness reading
            if (data.ripeness !== lastRipenessRef.current) {
              lastRipenessRef.current = data.ripeness;
              elapsedStartRef.current = Date.now();
            }

          } catch (err) {
            console.error('Analysis error:', err);
          }
        }, ANALYSIS_INTERVAL_MS);

        // ── FPS counter ──────────────────────────────────
        fpsPollId = setInterval(() => {
          setFps(frameCount);
          frameCount = 0;
        }, 1000);

      } catch (err) {
        // Common reason: user denied camera permission
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera access denied. Please allow camera access and refresh.'
            : `Camera error: ${err.message}`
        );
      }
    }

    startCamera();

    // Cleanup function: runs when component is removed from screen
    // IMPORTANT: always stop the camera and clear intervals!
    return () => {
      clearInterval(analysisPollId);
      clearInterval(fpsPollId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);  // [] = run once on mount

  // ── Elapsed timer (updates every 100ms) ───────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((Date.now() - elapsedStartRef.current) / 1000);
      setTime(new Date());
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'q') onBack();
      if (e.key === 'p' || e.key === 'P') {
        // Stop camera before switching
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        onSwitchPhoto();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack, onSwitchPhoto]);

  /**
   * captureFrame()
   * Draws the current video frame to the hidden canvas,
   * then reads it back as a base64 JPEG string.
   */
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    // Match canvas size to actual video dimensions
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // toDataURL gives us "data:image/jpeg;base64,..."
    // 0.75 = 75% JPEG quality (smaller = faster, still accurate enough)
    return canvas.toDataURL('image/jpeg', 0.75);
  }, []);

  // Get the ripeness colour class for the scan box border
  const borderClass = result ? getRipenessClass(result.ripeness) : '';

  return (
    <div className="analyzer-root">

      {/* ── Top HUD bar ─────────────────────────────────── */}
      <div className="hud-bar">
        <span className="brand">FruitScanner Pro</span>
        <span className="separator">|</span>
        <span className="mode-tag" style={{ color: 'var(--accent)' }}>LIVE CAMERA</span>
        <span className="clock">{time.toTimeString().slice(0,8)}</span>
      </div>

      {/* ── Main layout: feed + panel ────────────────────── */}
      <div className="analyzer-body">

        {/* ── Left: camera feed ─────────────────────────── */}
        <div className="feed-area">

          {error ? (
            <div className="feed-error">
              <div className="error-icon">⚠</div>
              <div className="error-msg">{error}</div>
              <button className="btn btn-primary" onClick={onBack}>← Back to Menu</button>
            </div>
          ) : (
            <>
              {/* Actual video from webcam */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="live-video"
              />

              {/* Hidden canvas — used only for frame capture, not visible */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Scan zone overlay */}
              <div className={`scan-zone ${borderClass}`}>
                <div className="scan-zone-label">[ SCAN ZONE ]</div>
                {/* Animated scan line */}
                <div className="scan-line" />
                {/* Corner brackets */}
                <Corner pos="tl" /><Corner pos="tr" />
                <Corner pos="bl" /><Corner pos="br" />
              </div>
            </>
          )}
        </div>

        {/* ── Right: results panel ──────────────────────── */}
        <ResultPanel
          result={result}
          mode="LIVE"
          fps={fps * Math.round(1000/ANALYSIS_INTERVAL_MS)}
          elapsed={elapsed}
        />

      </div>

      {/* ── Bottom hint bar ──────────────────────────────── */}
      <div className="hint-bar">
        <span><kbd>P</kbd> Photo mode</span>
        <span><kbd>ESC</kbd> Back to menu</span>
        <span>Place fruit in the scan zone</span>
      </div>

    </div>
  );
}

/** Small CSS-drawn corner bracket */
function Corner({ pos }) {
  return <div className={`corner corner-${pos}`} />;
}

/** Map ripeness string → CSS class */
function getRipenessClass(ripeness) {
  return {
    'Ripe':      'zone-ripe',
    'Semi-Ripe': 'zone-semi',
    'Unripe':    'zone-unripe',
    'No Fruit':  'zone-none',
  }[ripeness] || '';
}
