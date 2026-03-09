/**
 * Menu.js  —  Launch Screen Component
 * -------------------------------------
 * The first screen users see. Shows two big buttons:
 *   [CAM] LIVE CAMERA  →  starts webcam mode
 *   [IMG] ANALYSE PHOTO →  starts photo upload mode
 *
 * Props:
 *   onSelect(mode)  — called with "live" or "photo" when user clicks
 */

import React, { useState, useEffect } from 'react';
import './Menu.css';

export default function Menu({ onSelect }) {
  // `time` updates every second to show a live clock
  const [time, setTime] = useState(new Date());
  // `backendOk` shows whether the Python server is reachable
  const [backendOk, setBackendOk] = useState(null);

  // ── Run once when component mounts ──────────────────────────
  useEffect(() => {
    // Update clock every second
    const clockInterval = setInterval(() => setTime(new Date()), 1000);

    // Check if Flask backend is running
    checkBackend();

    // Cleanup: stop the clock when this component is removed from screen
    return () => clearInterval(clockInterval);
  }, []);   // [] means "run only once, on first render"

  const checkBackend = async () => {
    try {
      const res = await fetch('/api/health');
      setBackendOk(res.ok);
    } catch {
      setBackendOk(false);
    }
  };

  const formatTime = (d) =>
    d.toTimeString().slice(0, 8);  // "HH:MM:SS"

  return (
    <div className="menu-root">

      {/* ── Animated background grid ── */}
      <div className="menu-grid" aria-hidden="true" />

      {/* ── Glowing centre orb ── */}
      <div className="menu-glow" aria-hidden="true" />

      {/* ── Top HUD bar ── */}
      <div className="hud-bar">
        <span className="brand">FruitScanner Pro</span>
        <span className="separator">|</span>
        <span className="mode-tag">SELECT MODE</span>
        <span className="clock">{formatTime(time)}</span>
      </div>

      {/* ── Main content ── */}
      <div className="menu-content">

        {/* Title */}
        <div className="menu-title-block">
          <div className="menu-eyebrow">[ RIPENESS DETECTION SYSTEM ]</div>
          <h1 className="menu-title">FRUITSCANNER<br/>PRO</h1>
          <p className="menu-subtitle">
            Real-Time Camera &amp; Photo Analysis
          </p>
        </div>

        {/* Divider */}
        <div className="menu-divider">
          <span />
          <span className="menu-divider-text">SELECT INPUT MODE</span>
          <span />
        </div>

        {/* Mode buttons */}
        <div className="menu-buttons">

          <button className="menu-btn" onClick={() => onSelect('live')}>
            <div className="menu-btn-icon">◉</div>
            <div className="menu-btn-text">
              <span className="menu-btn-label">Live Camera</span>
              <span className="menu-btn-desc">Analyse fruit in real-time via webcam</span>
            </div>
            <div className="menu-btn-arrow">→</div>
          </button>

          <button className="menu-btn" onClick={() => onSelect('photo')}>
            <div className="menu-btn-icon">⊡</div>
            <div className="menu-btn-text">
              <span className="menu-btn-label">Analyse Photo</span>
              <span className="menu-btn-desc">Upload or drop an image file</span>
            </div>
            <div className="menu-btn-arrow">→</div>
          </button>

        </div>

        {/* Backend status indicator */}
        <div className="menu-status">
          <span className={`status-dot ${backendOk === true ? 'ok' : backendOk === false ? 'err' : 'checking'}`} />
          <span className="status-text">
            {backendOk === null  && 'Connecting to backend…'}
            {backendOk === true  && 'Backend connected — Python server running'}
            {backendOk === false && 'Backend offline — run: python app.py'}
          </span>
          {backendOk === false && (
            <button className="status-retry" onClick={checkBackend}>retry</button>
          )}
        </div>

      </div>

      {/* ── Bottom hint bar ── */}
      <div className="hint-bar">
        <span>Press <kbd>L</kbd> for Live</span>
        <span>Press <kbd>P</kbd> for Photo</span>
      </div>

      {/* Keyboard shortcuts */}
      <KeyHandler onSelect={onSelect} />

    </div>
  );
}

/** Listens for L / P keypresses on the menu screen */
function KeyHandler({ onSelect }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'l' || e.key === 'L') onSelect('live');
      if (e.key === 'p' || e.key === 'P') onSelect('photo');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelect]);
  return null;   // renders nothing, just attaches a side-effect
}
