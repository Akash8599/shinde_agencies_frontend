// src/utils/axiosInstance.js
// This is the key - axiosInstance with interceptors for token management

import axios from 'axios';
import API_CONFIG from '../config/Api';

// Create axios instance with base config
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BACKEND_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR - Add token to every request
// ============================================================
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Add token to Authorization header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request:', `Bearer ${token.substring(0, 30)}...`);
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    // Log the request
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle responses and errors
// ============================================================
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    // Handle different error types
    
    // 401 - Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      
      // Clear stored token and user data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    // 403 - Forbidden (user doesn't have permission)
    if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - User lacks permissions');
      const message = error.response?.data?.message || 'You do not have permission to perform this action.';
      return Promise.reject(new Error(message));
    }
    
    // 404 - Not Found
    if (error.response?.status === 404) {
      console.error('❌ 404 Not Found');
      return Promise.reject(new Error('Resource not found.'));
    }
    
    // 400 - Bad Request
    if (error.response?.status === 400) {
      console.error('❌ 400 Bad Request');
      const message = error.response?.data?.message || 'Invalid request data.';
      return Promise.reject(new Error(message));
    }
    
    // 409 - Conflict (e.g., duplicate SKU)
    if (error.response?.status === 409) {
      console.error('❌ 409 Conflict');
      const message = error.response?.data?.message || 'This resource already exists.';
      return Promise.reject(new Error(message));
    }
    
    // 500+ - Server Error
    if (error.response?.status >= 500) {
      console.error('❌ Server Error:', error.response.status);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Network error (no response from server)
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject(new Error(`Network error. Cannot connect to ${API_CONFIG.BACKEND_URL}`));
    }
    
    // Generic error
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;