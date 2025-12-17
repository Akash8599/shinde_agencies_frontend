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
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('userRole', response.data.role);

        console.log('Login successful:', response.data);

        // Notify parent component
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
        // Store token
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
    <div className="login-container">
      <div className="login-box">
        <h1 className="app-title">💼 Billing System</h1>
        <p className="app-subtitle">Hardware Shop Management</p>

        {error && <div className="error-message">{error}</div>}

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="toggle-text">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setFormData({ username: '', password: '', confirmPassword: '', email: '', role: 'ADMIN' });
                }}
                className="toggle-btn"
              >
                Register here
              </button>
            </p>
{/* 
            <div className="demo-credentials">
              <p>Demo Credentials:</p>
              <p>Username: <strong>admin</strong></p>
              <p>Password: <strong>admin123</strong></p>
            </div> */}
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Register</h2>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              {/* <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option> */}
              <option value="ADMIN">Admin</option>
            </select>

            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            <p className="toggle-text">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setFormData({ username: '', password: '', confirmPassword: '', email: '', role: 'ADMIN' });
                }}
                className="toggle-btn"
              >
                Login here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;