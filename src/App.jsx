import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard, { HomeView, SettingsView } from './components/Dashboard';
import CompanySettings from './pages/CompanySettings';
import ProductManagement from './pages/ProductManagement';
import Shop from './pages/Shop';
import SalesOrder from './pages/SalesOrder';
import CustomerManagement from './pages/CustomerManagement';
import PurchaseOrderManagement from './pages/PurchaseOrderManagement';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

    // ✅ Redirect to original page or dashboard
    const origin = location.state?.from?.pathname || '/dashboard';
    navigate(origin, { replace: true });
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
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        {/* ✅ Register Route */}
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        >
          {/* Default child route redirects to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<HomeView />} />
          <Route path="shop" element={<Shop />} />
          <Route path="products" element={<ProductManagement />} />
          {/* ✅ Edit Product Route */}
          <Route path="products/:productId" element={<ProductManagement />} />
          {/* ✅ Delete Product Route */}
          <Route path="products/:productId/delete" element={<ProductManagement />} />
          <Route path="customers" element={<CustomerManagement />} />
          {/* ✅ Edit Customer Route */}
          <Route path="customers/:customerId" element={<CustomerManagement />} />
          {/* ✅ Delete Customer Route */}
          <Route path="customers/:customerId/delete" element={<CustomerManagement />} />
          <Route path="purchase-orders" element={<PurchaseOrderManagement />} />
          {/* ✅ View PO Route */}
          <Route path="purchase-orders/:orderId" element={<PurchaseOrderManagement />} />
          <Route path="orders" element={<SalesOrder />} />
          {/* ✅ View Order Route */}
          <Route path="orders/:orderId" element={<SalesOrder />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>

        <Route
          path="/company-settings"
          element={
            isAuthenticated ? (
              <CompanySettings onBackToDashboard={handleBackToDashboard} />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;