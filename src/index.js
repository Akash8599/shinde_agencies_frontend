import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
// import './Index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // ✅ REMOVED StrictMode to prevent double API calls in development
  // Note: StrictMode is helpful for detecting issues, but calls effects twice
  // <React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  // </React.StrictMode>
);
