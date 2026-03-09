/**
 * ResultPanel.js  —  Analysis Results Panel (Right Side)
 * --------------------------------------------------------
 * Reusable panel showing ripeness result, colour bars, and confidence.
 * Used by BOTH LiveAnalyzer and PhotoAnalyzer.
 *
 * Props:
 *   result  — object from backend: { ripeness, red_pct, yellow_pct, green_pct, confidence, advice }
 *   mode    — "LIVE" | "PHOTO"  (shown in header)
 *   fps     — optional number (only in live mode)
 *   elapsed — optional number in seconds
 */

import React from 'react';
import './ResultPanel.css';

// Map ripeness string → CSS class for colour
const COLOUR_CLASS = {
  'Ripe':      'color-ripe',
  'Semi-Ripe': 'color-semi',
  'Unripe':    'color-unripe',
  'No Fruit':  'color-none',
};

export default function ResultPanel({ result, mode = 'LIVE', fps, elapsed }) {
  // If no result yet, show a loading state
  if (!result) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-brand">FRUITSCANNER PRO</span>
          <span className={`panel-mode ${mode === 'LIVE' ? 'mode-live' : 'mode-photo'}`}>{mode}</span>
        </div>
        <div className="panel-loading">
          <div className="loading-dot" />
          <span>Waiting for analysis…</span>
        </div>
      </div>
    );
  }

  const { ripeness, red_pct, yellow_pct, green_pct, confidence, advice } = result;
  const colClass   = COLOUR_CLASS[ripeness] || 'color-none';

  // Normalise bars: highest value = full bar, others are proportional
  const maxPct = Math.max(red_pct, yellow_pct, green_pct, 0.01);
  const normR  = red_pct    / maxPct;
  const normY  = yellow_pct / maxPct;
  const normG  = green_pct  / maxPct;

  return (
    <div className="panel">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="panel-header">
        <span className="panel-brand">FRUITSCANNER PRO</span>
        <span className={`panel-mode ${mode === 'LIVE' ? 'mode-live' : 'mode-photo'}`}>{mode}</span>
        {fps !== undefined && (
          <span className="panel-fps">{fps} FPS</span>
        )}
      </div>

      <div className="panel-divider" />

      {/* ── Ripeness result ───────────────────────────────────── */}
      <section className="panel-section">
        <div className="section-label">RESULT</div>
        <div className={`ripeness-label ${colClass}`}>{ripeness.toUpperCase()}</div>
        <div className="ripeness-advice">{advice}</div>
      </section>

      <div className="panel-divider" />

      {/* ── Colour percentage bars ────────────────────────────── */}
      <section className="panel-section">
        <div className="section-label">COLOUR ANALYSIS</div>

        <ColourBar
          label="RED (Ripe)"
          pct={red_pct}
          norm={normR}
          className="bar-red"
        />
        <ColourBar
          label="AMBER (Semi)"
          pct={yellow_pct}
          norm={normY}
          className="bar-amber"
        />
        <ColourBar
          label="GREEN (Unripe)"
          pct={green_pct}
          norm={normG}
          className="bar-green"
        />
      </section>

      <div className="panel-divider" />

      {/* ── Confidence gauge ──────────────────────────────────── */}
      <section className="panel-section">
        <div className="section-label">CONFIDENCE</div>
        <ConfidenceGauge value={confidence} colClass={colClass} />
      </section>

      <div className="panel-divider" />

      {/* ── Elapsed time (if provided) ────────────────────────── */}
      {elapsed !== undefined && (
        <section className="panel-section">
          <div className="section-label">READING TIME</div>
          <div className={`elapsed-time ${colClass}`}>{elapsed.toFixed(1)}s</div>
        </section>
      )}

      {/* ── Keyboard hints ────────────────────────────────────── */}
      <div className="panel-hints">
        {mode === 'LIVE' ? (
          <>
            <span><kbd>P</kbd> Photo mode</span>
            <span><kbd>ESC</kbd> Menu</span>
          </>
        ) : (
          <>
            <span><kbd>L</kbd> Live mode</span>
            <span><kbd>ESC</kbd> Menu</span>
          </>
        )}
      </div>

    </div>
  );
}

/* ── Sub-component: one colour bar row ────────────────────────── */
function ColourBar({ label, pct, norm, className }) {
  return (
    <div className="colour-bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div
          className={`bar-fill ${className}`}
          style={{ width: `${norm * 100}%` }}
        />
      </div>
      <div className={`bar-pct ${className}`}>{pct.toFixed(1)}%</div>
    </div>
  );
}

/* ── Sub-component: circular SVG confidence gauge ─────────────── */
function ConfidenceGauge({ value, colClass }) {
  // SVG circle maths
  const radius      = 40;
  const circumference = 2 * Math.PI * radius;
  // We show a 270° arc (3/4 of circle) — multiply circumference by 0.75
  const arcLength   = circumference * 0.75;
  const filled      = arcLength * (value / 100);
  const dashOffset  = arcLength - filled;

  return (
    <div className="gauge-wrapper">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background arc (grey) */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--panel-border)"
          strokeWidth="7"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(135 50 50)"
        />
        {/* Value arc (coloured) */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          className={`gauge-arc ${colClass}`}
          strokeWidth="7"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={-dashOffset}
          strokeLinecap="round"
          transform="rotate(135 50 50)"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        {/* Centre text */}
        <text
          x="50" y="55"
          textAnchor="middle"
          className={`gauge-text ${colClass}`}
          fontSize="13"
          fontFamily="'Share Tech Mono', monospace"
        >
          {Math.round(value)}%
        </text>
      </svg>
      <div className="gauge-label">CONFIDENCE</div>
    </div>
  );
}
