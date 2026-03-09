/**
 * App.js — Root Component & Page Router
 * ----------------------------------------
 * This is the top-level component. It decides WHICH page to show
 * based on the `mode` state variable:
 *
 *   "menu"  → <Menu />        — the launch screen
 *   "live"  → <LiveAnalyzer /> — webcam mode
 *   "photo" → <PhotoAnalyzer /> — image upload mode
 *
 * Think of `mode` as a traffic light — it controls what the user sees.
 */

import React, { useState } from 'react';
import Menu         from './components/Menu';
import LiveAnalyzer from './components/LiveAnalyzer';
import PhotoAnalyzer from './components/PhotoAnalyzer';

export default function App() {
  // useState gives us a variable + a function to change it
  // When we call setMode("live"), React automatically re-renders the page
  const [mode, setMode] = useState('menu');   // start on the menu

  return (
    <div className="app-root">
      {/* Render the right component based on current mode */}
      {mode === 'menu'  && <Menu onSelect={setMode} />}
      {mode === 'live'  && <LiveAnalyzer  onBack={() => setMode('menu')} onSwitchPhoto={() => setMode('photo')} />}
      {mode === 'photo' && <PhotoAnalyzer onBack={() => setMode('menu')} onSwitchLive={() => setMode('live')} />}
    </div>
  );
}
