import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import ProductManagement from '../pages/ProductManagement';
import Shop from '../pages/Shop';
import logo from '../assets/logo-transparent.png';
import SalesOrder from '../pages/SalesOrder';
import CustomerManagement from '../pages/CustomerManagement';
import PurchaseOrderManagement from '../pages/PurchaseOrderManagement';
import CompanySettings from '../pages/CompanySettings';
import API_CONFIG from '../config/Api';
import './Dashboard.css';
import './Dashboard-Tailwind.css';

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
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // ✅ Live timestamp update - updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close mobile menu when view changes
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false);
    }
  };

  // ✅ Handle Menu Toggle (Desktop Hide / Mobile Open)
  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarHidden(!sidebarHidden);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // ✅ Format time for display
  const formatTime = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarHidden ? 'hidden-desktop' : ''}`}>
        <div className="sidebar-header">
          <h2>Shopix</h2>
          <p className="user-info">👤 {userName}</p>
          <p className="role-badge">{userRole}</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink
                to="/dashboard"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                📊 Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                📦 Products
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/shop"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                🛒 Shop & Cart
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/orders"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                📋 Sales Orders
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/customers"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                👥 Customers
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-orders"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                🛒 Purchase Orders
              </NavLink>
            </li>

            <li className="settings-section">
              <NavLink
                to="/settings"
                onClick={closeMobileMenu}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                ⚙️ Settings
              </NavLink>
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
              onClick={handleMenuToggle}
            >
              ☰
            </button>
            <h1>🏪 SHINDE AGENCIES</h1>
          </div>
          <div className="header-actions">
            <span className="timestamp">
              {formatTime(currentTime)}
            </span>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOME VIEW - DASHBOARD WITH STATS & AGENCY SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

export const HomeView = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState('SHINDE AGENCIES');

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
      console.error('Error fetching company name:', error);
    }
  };

  // ✅ Main fetch function for dashboard statistics (PARALLELIZED)
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Helper to fetch array counts safely
      const fetchCount = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return 0;
          const text = await res.text();
          if (text.trim().startsWith('<')) return 0;
          const data = safeJsonParse(text);
          return Array.isArray(data) ? data.length : 0;
        } catch (err) {
          console.warn(`Failed to fetch count from ${url}`, err);
          return 0;
        }
      };

      // Helper to fetch order summary safely
      const fetchOrderSummary = async () => {
        try {
          const url = `${API_CONFIG.BACKEND_URL}/api/sales-orders/summary/all`;
          const res = await fetch(url, { headers });
          if (!res.ok) return { totalOrders: 0, totalRevenue: 0, unpaidOrders: 0 };
          const text = await res.text();
          if (text.trim().startsWith('<')) return { totalOrders: 0, totalRevenue: 0, unpaidOrders: 0 };
          const data = safeJsonParse(text);
          return data || { totalOrders: 0, totalRevenue: 0, unpaidOrders: 0 };
        } catch (err) {
          console.warn('Failed to fetch order summary', err);
          return { totalOrders: 0, totalRevenue: 0, unpaidOrders: 0 };
        }
      };

      // ⚡ EXECUTE REQUESTS IN PARALLEL
      // This reduces wait time significantly compared to sequential awaits
      const [totalProducts, orderStats, totalCustomers] = await Promise.all([
        fetchCount(`${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`),
        fetchOrderSummary(),
        fetchCount(`${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}`)
      ]);

      setStats({
        totalProducts,
        totalOrders: orderStats.totalOrders || 0,
        totalRevenue: orderStats.totalRevenue || 0,
        totalCustomers,
        pendingOrders: orderStats.unpaidOrders || 0
      });

      setLoading(false);

    } catch (error) {
      console.error('Dashboard Stats Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // ✅ FIXED: Optimized logic to decouple fast/slow fetches
  useEffect(() => {
    let mounted = true;

    // 1. Fetch Company Name IMMEDIATELY (Fast, text only)
    fetchCompanyName();

    // 2. Fetch Heavy Stats with a small DELAY
    // This allows the route transition/animation to finish smoothly 
    // before minimizing network contention on the main thread.
    const timer = setTimeout(() => {
      if (mounted) {
        fetchDashboardStats();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []); // ✅ Empty dependency array - runs ONLY ONCE on mount

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
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="shop-name">
          <h1>
            <span className="emoji">🏪</span>
            {companyName}
          </h1>
        </div>
        <p className="shop-subtitle">Professional Business Management Platform</p>
      </section>

      {/* STATISTICS SECTION */}
      <div className="stats-content">
        <div className="stats-intro">
          <h2>Business Overview</h2>
          <p>Real-time statistics from your operations</p>
        </div>

        {error && (
          <div className="error-message">
            <div>
              <strong>⚠️ Error Loading Data</strong>
              {error}
            </div>
            <button onClick={() => fetchDashboardStats()}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : (
          <>
            {/* STAT CARDS - 3D EFFECTS */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📦 Total Products</h3>
                <p className="stat-value">{stats.totalProducts}</p>
                <p className="stat-label">In Catalog</p>
              </div>

              <div className="stat-card">
                <h3>📋 Total Orders</h3>
                <p className="stat-value">{stats.totalOrders}</p>
                <p className="stat-label">Placed</p>
              </div>

              <div className="stat-card">
                <h3>💰 Total Revenue</h3>
                <p className="stat-value">
                  {formatCurrency(stats.totalRevenue).replace(API_CONFIG.DEFAULTS.CURRENCY_SYMBOL, '')}
                </p>
                <p className="stat-label">Earned</p>
              </div>

              <div className="stat-card">
                <h3>👥 Customers</h3>
                <p className="stat-value">{stats.totalCustomers}</p>
                <p className="stat-label">Active</p>
              </div>

              <div className="stat-card">
                <h3>⏳ Pending Orders</h3>
                <p className="stat-value">{stats.pendingOrders}</p>
                <p className="stat-label">Awaiting Payment</p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button
                  onClick={() => navigate('/products')}
                  className="action-btn"
                >
                  ➕ Add Product
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="action-btn"
                >
                  📋 View Orders
                </button>
                <button
                  onClick={() => navigate('/customers')}
                  className="action-btn"
                >
                  👥 Customers
                </button>
                <button
                  onClick={() => navigate('/purchase-orders')}
                  className="action-btn"
                >
                  🛒 Purchase
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* AGENCY/COMPANY SHOWCASE SECTION */}
      <section className="agency-showcase">
        <div className="agency-header">
          <h2>Team & Leadership</h2>
          <p>Meet the professionals behind your success</p>
        </div>

        <div className="agency-cards">
          {/* Leadership Card 1 */}
          <div className="agency-card">
            <div className="agency-logo">👨‍💼</div>
            <div className="agency-name">Management</div>
            <div className="agency-role">Operations Lead</div>
            <p className="agency-description">
              Driving operational excellence and strategic growth through innovative business solutions and data-driven decisions.
            </p>
            <span className="agency-badge">Premium Support</span>
          </div>

          {/* Leadership Card 2 */}
          <div className="agency-card">
            <div className="agency-logo">👩‍💼</div>
            <div className="agency-name">Executive</div>
            <div className="agency-role">Sales Strategy</div>
            <p className="agency-description">
              Empowering teams with cutting-edge sales strategies and customer relationship management excellence.
            </p>
            <span className="agency-badge">Client Focused</span>
          </div>

          {/* Company Card */}
          <div className="agency-card">
            <div className="agency-logo">🏢</div>
            <div className="agency-name">Enterprise</div>
            <div className="agency-role">Technical Innovation</div>
            <p className="agency-description">
              Leveraging advanced technology platforms to deliver seamless, scalable, and secure business solutions.
            </p>
            <span className="agency-badge">Industry Leader</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

export const SettingsView = () => {
  const navigate = useNavigate();
  return (
    <div className="settings-view">
      <h2>⚙️ Configuration</h2>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-icon">🏢</div>
          <h3>Company Settings</h3>
          <p>Manage company details, bank information, logos, and signatures for professional invoices</p>
          <button
            onClick={() => navigate('/company-settings')}
            className="btn btn-primary full-width"
          >
            ⚙️ Configure
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Manage team accounts, roles, permissions, and access controls</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">🎨</div>
          <h3>Theme & Appearance</h3>
          <p>Customize dashboard theme, colors, and visual preferences</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>

        <div className="settings-card coming-soon">
          <div className="card-icon">📧</div>
          <h3>Email Configuration</h3>
          <p>Setup automated notifications and professional invoice delivery</p>
          <button className="btn btn-secondary full-width" disabled>
            🔒 Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;