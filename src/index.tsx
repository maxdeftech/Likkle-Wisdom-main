/**
 * Likkle Wisdom — Application entry point.
 * Bootstraps React, global error handlers, fonts, and mounts App inside an ErrorBoundary.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// --- Global error handlers (prevent crashes on Android WebView / unhandled rejections) ---
// Log unhandled promise rejections and prevent them from terminating the app
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason);
  event.preventDefault();
  event.stopPropagation();
});
// Log global synchronous errors (message, file, line, column, error object)
window.addEventListener('error', (event) => {
  console.error('[global error]', event.message, event.filename, event.lineno, event.colno, event.error);
});

// --- Bundled fonts for offline (iOS/Android + PWA) ---
// Ensures icons (Material Symbols) and text (Plus Jakarta Sans, Space Grotesk) render when network is off
import '@fontsource/material-symbols-outlined/100.css';
import '@fontsource/material-symbols-outlined/200.css';
import '@fontsource/material-symbols-outlined/300.css';
import '@fontsource/material-symbols-outlined/400.css';
import '@fontsource/material-symbols-outlined/500.css';
import '@fontsource/material-symbols-outlined/600.css';
import '@fontsource/material-symbols-outlined/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

// --- Mount root ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
