import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'ADMIN'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login request to:', API_CONFIG.BACKEND_URL + API_CONFIG.ENDPOINTS.LOGIN);
      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.LOGIN, {
        username: formData.username,
        password: formData.password
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('userRole', response.data.role);

        console.log('Login successful:', response.data);

        onLoginSuccess(response.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Check credentials.';
      setError(errorMessage);
      console.error('Login error:', {
        status: err.response?.status,
        message: errorMessage,
        url: err.config?.url
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('Register request to:', API_CONFIG.BACKEND_URL + API_CONFIG.ENDPOINTS.REGISTER);
      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.REGISTER, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('userRole', response.data.role);

        console.log('Registration successful:', response.data);

        onLoginSuccess(response.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      console.error('Register error:', {
        status: err.response?.status,
        message: errorMessage,
        url: err.config?.url
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background with Hardware Products */}
      <div className="bg-animation">
        <div className="background-grid"></div>
        
        {/* Product Images with Animation */}
        <div className="products-container">
          <div className="product-image product-1">
            <div className="product-card">🔧</div>
          </div>
          <div className="product-image product-2">
            <div className="product-card">⚙️</div>
          </div>
          <div className="product-image product-3">
            <div className="product-card">🪛</div>
          </div>
          <div className="product-image product-4">
            <div className="product-card">🔨</div>
          </div>
          <div className="product-image product-5">
            <div className="product-card">⛏️</div>
          </div>
          <div className="product-image product-6">
            <div className="product-card">🪚</div>
          </div>
          <div className="product-image product-7">
            <div className="product-card">🪜</div>
          </div>
          <div className="product-image product-8">
            <div className="product-card">📏</div>
          </div>
          <div className="product-image product-9">
            <div className="product-card">🧰</div>
          </div>
          <div className="product-image product-10">
            <div className="product-card">⚒️</div>
          </div>
          <div className="product-image product-11">
            <div className="product-card">🔩</div>
          </div>
          <div className="product-image product-12">
            <div className="product-card">🪓</div>
          </div>
        </div>

        {/* Floating Blobs */}
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        {/* Dark Overlay */}
        <div className="dark-overlay"></div>
      </div>

      {/* Left Side - Brand Info */}
      <div className="login-left">
        <div className="brand-section">
          <div className="brand-icon">🏭</div>
          <h1 className="brand-title">HardWare Pro</h1>
          <p className="brand-tagline">Wholesale Hardware Solutions</p>
          
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Fast Ordering</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>Bulk Shipping</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>Best Prices</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Secure Trading</span>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Register */}
      <div className="login-right">
        <div className="login-container">
          <div className="login-card">
            {/* Card Glow */}
            <div className="card-glow"></div>

            <div className="login-content">
              {error && (
                <div className="login-alert error">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">{error}</span>
                </div>
              )}

              {isLogin ? (
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className="login-button">
                    <span className="btn-text">{loading ? 'Signing in...' : 'Sign In'}</span>
                    <span className="btn-icon">→</span>
                  </button>

                  <div className="form-divider">
                    <span>New to HardWare Pro?</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                      setFormData({ username: '', password: '', confirmPassword: '', email: '', role: 'ADMIN' });
                    }}
                    className="toggle-btn"
                  >
                    Create Account
                  </button>

                  <p className="disclaimer">Protected by enterprise-grade security</p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="login-form">
                  <div className="form-header">
                    <h2>Get Started</h2>
                    <p>Create your wholesale account</p>
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="Your business name"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your@business.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* ✅ UNIQUE CLASS NAME */}
                  <div className="login-form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className="login-button">
                    <span className="btn-text">{loading ? 'Creating Account...' : 'Create Account'}</span>
                    <span className="btn-icon">→</span>
                  </button>

                  <div className="form-divider">
                    <span>Already have an account?</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                      setFormData({ username: '', password: '', confirmPassword: '', email: '', role: 'ADMIN' });
                    }}
                    className="toggle-btn"
                  >
                    Sign In
                  </button>

                  <p className="disclaimer">Your data is encrypted and secure</p>
                </form>
              )}
            </div>
          </div>

          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <span>•</span>
            <a href="#">Terms of Service</a>
            <span>•</span>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;