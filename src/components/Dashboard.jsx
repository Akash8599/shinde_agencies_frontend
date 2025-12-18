import React, { useState, useEffect } from 'react';
import ProductManagement from '../pages/ProductManagement';
import Shop from '../pages/Shop';
import SalesOrder from '../pages/SalesOrder';
import CustomerManagement from '../pages/CustomerManagement';
import PurchaseOrderManagement from '../pages/PurchaseOrderManagement';
import CompanySettings from '../pages/CompanySettings';
import API_CONFIG from '../config/Api';
import './Dashboard.css';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Safe JSON Parse
// ═══════════════════════════════════════════════════════════════════════════════

const safeJsonParse = (text) => {
  try {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    
    if (text.trim().startsWith('<')) {
      return null;
    }
    
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const Dashboard = ({ user, onLogout, onNavigateToSettings }) => {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUserName(user.username);
      setUserRole(user.role);
    } else {
      const savedUser = localStorage.getItem('username');
      const savedRole = localStorage.getItem('userRole');
      if (savedUser) setUserName(savedUser);
      if (savedRole) setUserRole(savedRole);
    }
    setLoading(false);
  }, [user]);

  // Close mobile menu when view changes
  const handleNavClick = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeView setCurrentView={handleNavClick} />;
      case 'products':
        return <ProductManagement />;
      case 'shop':
        return <Shop />;
      case 'orders':
        return <SalesOrder />;
      case 'customers':
        return <CustomerManagement />;
      case 'purchase':
        return <PurchaseOrderManagement />;
      case 'settings':
        return <SettingsView onNavigateToSettings={onNavigateToSettings} />;
      default:
        return <HomeView setCurrentView={handleNavClick} />;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>🛍️ Shop Manager</h2>
          <p className="user-info">👤 {userName}</p>
          <p className="role-badge">Role: {userRole}</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button
                onClick={() => handleNavClick('home')}
                className={currentView === 'home' ? 'active' : ''}
              >
                📊 Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('products')}
                className={currentView === 'products' ? 'active' : ''}
              >
                📦 Products
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('shop')}
                className={currentView === 'shop' ? 'active' : ''}
              >
                🛒 Shop & Cart
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('orders')}
                className={currentView === 'orders' ? 'active' : ''}
              >
                📋 Sales Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('customers')}
                className={currentView === 'customers' ? 'active' : ''}
              >
                👥 Customers
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('purchase')}
                className={currentView === 'purchase' ? 'active' : ''}
              >
                🛒 Purchase Orders
              </button>
            </li>

            <li className="settings-section">
              <button
                onClick={() => handleNavClick('settings')}
                className={currentView === 'settings' ? 'active' : ''}
              >
                ⚙️ Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <h1>🏪 Shop Owner Dashboard</h1>
          </div>
          <div className="header-actions">
            <span className="timestamp">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </header>

        <div className="content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOME VIEW - DASHBOARD WITH STATS
// ═══════════════════════════════════════════════════════════════════════════════

const HomeView = ({ setCurrentView }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState('Your Shop');

  useEffect(() => {
    fetchDashboardStats();
    fetchCompanyName();
  }, []);

  // ✅ Fetch company name from API
  const fetchCompanyName = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return;
      }

      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/company-settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.status === 304) {
        return;
      }

      if (response.ok) {
        const text = await response.text();
        const data = safeJsonParse(text);
        if (data?.companyName) {
          setCompanyName(data.companyName);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // ✅ Main fetch function for dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        const errorMsg = 'No authentication token found. Please login again.';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      let totalProducts = 0;
      let totalOrders = 0;
      let totalRevenue = 0;
      let totalCustomers = 0;
      let unpaidOrders = 0;

      // ✅ FETCH PRODUCTS using config endpoints
      try {
        const url = `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`;
        const productsRes = await fetch(url, { 
          method: 'GET',
          headers 
        });

        if (productsRes.status === 304) {
          totalProducts = 0;
        } else if (productsRes.ok) {
          const text = await productsRes.text();
          
          if (text.trim().startsWith('<')) {
            totalProducts = 0;
          } else {
            const products = safeJsonParse(text);
            totalProducts = Array.isArray(products) ? products.length : 0;
          }
        } else {
          totalProducts = 0;
        }
      } catch (err) {
        totalProducts = 0;
      }

      // ✅ FETCH SALES ORDERS SUMMARY using config endpoints
      try {
        const url = `${API_CONFIG.BACKEND_URL}/api/sales-orders/summary/all`;
        const ordersRes = await fetch(url, { 
          method: 'GET',
          headers 
        });

        if (ordersRes.status === 304) {
          totalOrders = 0;
          totalRevenue = 0;
          unpaidOrders = 0;
        } else if (ordersRes.ok) {
          const text = await ordersRes.text();
          
          if (text.trim().startsWith('<')) {
            totalOrders = 0;
            totalRevenue = 0;
            unpaidOrders = 0;
          } else {
            const ordersSummary = safeJsonParse(text);
            totalOrders = ordersSummary?.totalOrders || 0;
            totalRevenue = ordersSummary?.totalRevenue || 0;
            unpaidOrders = ordersSummary?.unpaidOrders || 0;
          }
        } else {
          totalOrders = 0;
          totalRevenue = 0;
          unpaidOrders = 0;
        }
      } catch (err) {
        totalOrders = 0;
        totalRevenue = 0;
        unpaidOrders = 0;
      }

      // ✅ FETCH CUSTOMERS using config endpoints
      try {
        const url = `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}`;
        const customersRes = await fetch(url, { 
          method: 'GET',
          headers 
        });

        if (customersRes.status === 304) {
          totalCustomers = 0;
        } else if (customersRes.ok) {
          const text = await customersRes.text();
          
          if (text.trim().startsWith('<')) {
            totalCustomers = 0;
          } else {
            const customers = safeJsonParse(text);
            totalCustomers = Array.isArray(customers) ? customers.length : 0;
          }
        } else {
          totalCustomers = 0;
        }
      } catch (err) {
        totalCustomers = 0;
      }

      // ✅ Update state
      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        pendingOrders: unpaidOrders
      });

      setLoading(false);
    } catch (error) {
      const errorMsg = `Critical error: ${error.message}`;
      setError(errorMsg);
      setLoading(false);
    }
  };

  // Format currency using config
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return `${API_CONFIG.DEFAULTS.CURRENCY_SYMBOL}0`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: API_CONFIG.DEFAULTS.CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="home-view">
      <section className="hero-section">
        <div className="shop-name">
          <h1>
            <span className="emoji">🏪</span>
            {companyName}
          </h1>
        </div>
        <p className="shop-subtitle">Welcome to your dashboard! Manage your business with ease.</p>
      </section>

      <div className="stats-content">
        <div className="stats-intro">
          <h2>Business Overview</h2>
          <p>Real-time statistics from your store</p>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            marginBottom: '24px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33'
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => fetchDashboardStats()}
              style={{
                marginLeft: '12px',
                padding: '6px 12px',
                background: '#c33',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card primary">
                <h3>📦 Total Products</h3>
                <p className="stat-value">{stats.totalProducts}</p>
                <p className="stat-label">In catalog</p>
              </div>

              <div className="stat-card success">
                <h3>📋 Total Orders</h3>
                <p className="stat-value">{stats.totalOrders}</p>
                <p className="stat-label">Placed</p>
              </div>

              <div className="stat-card info">
                <h3>💰 Total Revenue</h3>
                <p className="stat-value">
                  {formatCurrency(stats.totalRevenue).replace(API_CONFIG.DEFAULTS.CURRENCY_SYMBOL, '')}
                </p>
                <p className="stat-label">Earned</p>
              </div>

              <div className="stat-card warning">
                <h3>👥 Customers</h3>
                <p className="stat-value">{stats.totalCustomers}</p>
                <p className="stat-label">Active</p>
              </div>

              <div className="stat-card danger">
                <h3>⏳ Pending Orders</h3>
                <p className="stat-value">{stats.pendingOrders}</p>
                <p className="stat-label">Awaiting Payment</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button 
                  onClick={() => setCurrentView('products')}
                  className="action-btn"
                >
                  ➕ Add Product
                </button>
                <button 
                  onClick={() => setCurrentView('orders')}
                  className="action-btn"
                >
                  📋 View Orders
                </button>
                <button 
                  onClick={() => setCurrentView('customers')}
                  className="action-btn"
                >
                  👥 Customers
                </button>
                <button 
                  onClick={() => setCurrentView('purchase')}
                  className="action-btn"
                >
                  🛒 Purchase
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsView = ({ onNavigateToSettings }) => {
  return (
    <div className="settings-view">
      <h2>⚙️ Settings & Configuration</h2>
      
      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-icon">🏢</div>
          <h3>Company Settings</h3>
          <p>Manage company details, bank information, logo, and signature for invoices</p>
          <button 
            onClick={onNavigateToSettings}
            className="btn btn-primary full-width"
          >
            ⚙️ Go to Company Settings
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Manage user accounts and permissions</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">🎨</div>
          <h3>Theme & Appearance</h3>
          <p>Customize the dashboard theme and colors</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">📧</div>
          <h3>Email Configuration</h3>
          <p>Setup email notifications and invoice delivery</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;