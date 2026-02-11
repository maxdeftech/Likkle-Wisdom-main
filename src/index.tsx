import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/* Bundled fonts for offline (iOS/Android + PWA). Prevents icon names and text showing when network is off. */
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
