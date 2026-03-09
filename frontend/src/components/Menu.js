/**
 * Menu.js — Launch Screen
 * Logic unchanged. Markup updated with description tags for clarity.
 */

import React, { useState, useEffect } from 'react';
import './Menu.css';

export default function Menu({ onSelect }) {
  const [time, setTime]         = useState(new Date());
  const [backendOk, setBackendOk] = useState(null);

  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    checkBackend();
    return () => clearInterval(clockInterval);
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch('/api/health');
      setBackendOk(res.ok);
    } catch {
      setBackendOk(false);
    }
  };

  const formatTime = (d) => d.toTimeString().slice(0, 8);

  return (
    <div className="menu-root">

      {/* Background atmosphere */}
      <div className="menu-grid"  aria-hidden="true" />
      <div className="menu-glow"  aria-hidden="true" />

      {/* Top HUD */}
      <div className="hud-bar">
        <span className="brand">FruitScanner Pro</span>
        <span className="separator">|</span>
        <span className="mode-tag" style={{ color: 'var(--accent)' }}>System Ready</span>
        <span className="clock">{formatTime(time)}</span>
      </div>

      {/* ── Central content ──────────────────────────────────── */}
      <main className="menu-content">

        {/* Title + what this tool does */}
        <div className="menu-title-block">
          <p className="menu-eyebrow">[ AI-Powered Ripeness Detection ]</p>
          <h1 className="menu-title">Fruit<br/>Scanner<br/>Pro</h1>

          {/* Explains the product to new users */}
          <p className="menu-description">
            Point your camera at any fruit and get an instant ripeness reading.
            Uses computer vision to analyse colour distribution and classify
            whether your fruit is ripe, semi-ripe, or unripe.
          </p>

          <div className="menu-tags">
            <span className="menu-tag">Real-Time Analysis</span>
            <span className="menu-tag">Photo Upload</span>
            <span className="menu-tag">OpenCV HSV</span>
            <span className="menu-tag">Instant Results</span>
          </div>
        </div>

        {/* Divider */}
        <div className="menu-divider">
          <div className="menu-divider-line" />
          <span className="menu-divider-text">Choose input method</span>
          <div className="menu-divider-line" />
        </div>

        {/* Mode buttons */}
        <div className="menu-buttons" role="group" aria-label="Input mode selection">

          <button className="menu-btn" onClick={() => onSelect('live')}>
            <div className="menu-btn-icon" aria-hidden="true">◉</div>
            <div className="menu-btn-text">
              <span className="menu-btn-label">Live Camera</span>
              <span className="menu-btn-desc">Real-time webcam feed — hold fruit in front of camera</span>
            </div>
            <div className="menu-btn-arrow" aria-hidden="true">→</div>
          </button>

          <button className="menu-btn" onClick={() => onSelect('photo')}>
            <div className="menu-btn-icon" aria-hidden="true">⊡</div>
            <div className="menu-btn-text">
              <span className="menu-btn-label">Analyse a Photo</span>
              <span className="menu-btn-desc">Upload or drag-and-drop any image file</span>
            </div>
            <div className="menu-btn-arrow" aria-hidden="true">→</div>
          </button>

        </div>

        {/* Backend status */}
        <div className="menu-status" role="status" aria-live="polite">
          <span className={`status-dot ${
            backendOk === true  ? 'ok'       :
            backendOk === false ? 'err'      : 'checking'
          }`} />
          <span className="status-text">
            {backendOk === null  && 'Connecting to analysis engine…'}
            {backendOk === true  && 'Analysis engine online — ready to scan'}
            {backendOk === false && 'Engine offline — run: python app.py'}
          </span>
          {backendOk === false && (
            <button className="status-retry" onClick={checkBackend}>retry</button>
          )}
        </div>

      </main>

      {/* Bottom hint bar */}
      <div className="hint-bar">
        <span><kbd>L</kbd> Live camera</span>
        <span style={{ color: 'var(--accent)', opacity: 0.3, fontSize: '0.5rem', letterSpacing:'0.2em' }}>
          FRUITSCANNER PRO
        </span>
        <span><kbd>P</kbd> Photo mode</span>
      </div>

      <KeyHandler onSelect={onSelect} />

    </div>
  );
}

function KeyHandler({ onSelect }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'l' || e.key === 'L') onSelect('live');
      if (e.key === 'p' || e.key === 'P') onSelect('photo');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelect]);
  return null;
}
