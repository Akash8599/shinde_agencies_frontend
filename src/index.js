import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './Index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // ✅ REMOVED StrictMode to prevent double API calls in development
  // Note: StrictMode is helpful for detecting issues, but calls effects twice
  <App />
);
