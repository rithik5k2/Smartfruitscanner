/**
 * index.js — React Entry Point
 * 
 * This is the VERY FIRST file React runs.
 * It finds the <div id="root"> in public/index.html
 * and mounts our entire App component inside it.
 * You almost never need to edit this file.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';     // global styles
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
