import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import CompanySettings from './pages/CompanySettings';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' or 'settings'

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    if (token && username && userRole) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser({ username, role: userRole });
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const handleLoginSuccess = (loginData) => {
    setUser({
      username: loginData.username,
      role: loginData.role
    });
    setIsAuthenticated(true);
    setCurrentPage('dashboard'); // Go to dashboard after login
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');

    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];

    // Reset state
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigateToSettings = () => {
    setCurrentPage('settings');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // If authenticated, show dashboard or settings based on currentPage
  return (
    <div className="App">
      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onNavigateToSettings={handleNavigateToSettings}
        />
      )}
      {currentPage === 'settings' && (
        <CompanySettings
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default App;