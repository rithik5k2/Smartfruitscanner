/**
 * ResultPanel.js — Analysis Results Panel
 * Logic 100% unchanged. Minor markup cleanup for accessibility.
 */

import React from 'react';
import './ResultPanel.css';

const COLOUR_CLASS = {
  'Ripe':      'color-ripe',
  'Semi-Ripe': 'color-semi',
  'Unripe':    'color-unripe',
  'No Fruit':  'color-none',
};

export default function ResultPanel({ result, mode = 'LIVE', fps, elapsed }) {

  if (!result) {
    return (
      <aside className="panel" aria-label="Analysis results">
        <div className="panel-header">
          <span className="panel-brand">Analysis</span>
          <span className={`panel-mode ${mode === 'LIVE' ? 'mode-live' : 'mode-photo'}`}>{mode}</span>
        </div>
        <div className="panel-loading">
          <div className="loading-dot" aria-hidden="true" />
          <span>Waiting for scan…</span>
          <p>Point the camera at a fruit within the scan zone</p>
        </div>
      </aside>
    );
  }

  const { ripeness, red_pct, yellow_pct, green_pct, confidence, advice } = result;
  const colClass = COLOUR_CLASS[ripeness] || 'color-none';

  const maxPct = Math.max(red_pct, yellow_pct, green_pct, 0.01);
  const normR  = red_pct    / maxPct;
  const normY  = yellow_pct / maxPct;
  const normG  = green_pct  / maxPct;

  return (
    <aside className="panel" aria-label="Analysis results" aria-live="polite">

      {/* Header */}
      <div className="panel-header">
        <span className="panel-brand">Results</span>
        <span className={`panel-mode ${mode === 'LIVE' ? 'mode-live' : 'mode-photo'}`}>{mode}</span>
        {fps !== undefined && <span className="panel-fps">{fps} fps</span>}
      </div>

      {/* Ripeness */}
      <section className="panel-section">
        <div className="section-label">Ripeness</div>
        <div className={`ripeness-label ${colClass}`}>{ripeness}</div>
        <div className="ripeness-advice">{advice}</div>
      </section>

      <div className="panel-divider" role="separator" />

      {/* Colour analysis */}
      <section className="panel-section">
        <div className="section-label">Colour Analysis</div>
        <ColourBar label="Red (Ripe)"    pct={red_pct}    norm={normR} className="bar-red"   />
        <ColourBar label="Amber (Semi)"  pct={yellow_pct} norm={normY} className="bar-amber" />
        <ColourBar label="Green (Unripe)" pct={green_pct} norm={normG} className="bar-green" />
      </section>

      <div className="panel-divider" role="separator" />

      {/* Confidence */}
      <section className="panel-section">
        <div className="section-label">Confidence</div>
        <ConfidenceGauge value={confidence} colClass={colClass} />
      </section>

      {/* Elapsed time */}
      {elapsed !== undefined && (
        <>
          <div className="panel-divider" role="separator" />
          <section className="panel-section">
            <div className="section-label">Reading Time</div>
            <div className={`elapsed-time ${colClass}`}>{elapsed.toFixed(1)}s</div>
          </section>
        </>
      )}

      {/* Keyboard hints */}
      <div className="panel-hints" aria-label="Keyboard shortcuts">
        {mode === 'LIVE' ? (
          <>
            <span><kbd>P</kbd> Photo</span>
            <span><kbd>ESC</kbd> Menu</span>
          </>
        ) : (
          <>
            <span><kbd>L</kbd> Live</span>
            <span><kbd>ESC</kbd> Menu</span>
          </>
        )}
      </div>

    </aside>
  );
}

function ColourBar({ label, pct, norm, className }) {
  return (
    <div className="colour-bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`bar-fill ${className}`} style={{ width: `${norm * 100}%` }} />
      </div>
      <div className={`bar-pct ${className}`}>{pct.toFixed(1)}%</div>
    </div>
  );
}

function ConfidenceGauge({ value, colClass }) {
  const radius       = 38;
  const circumference = 2 * Math.PI * radius;
  const arcLength    = circumference * 0.75;
  const filled       = arcLength * (value / 100);
  const dashOffset   = arcLength - filled;

  return (
    <div className="gauge-wrapper">
      <svg width="90" height="90" viewBox="0 0 100 100" aria-label={`Confidence: ${Math.round(value)}%`}>
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 50 50)"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          className={`gauge-arc ${colClass}`}
          strokeWidth="6"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={-dashOffset}
          strokeLinecap="round"
          transform="rotate(135 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" className={`gauge-text ${colClass}`} fontSize="12">
          {Math.round(value)}%
        </text>
      </svg>
      <div className="gauge-label">Confidence</div>
    </div>
  );
}
