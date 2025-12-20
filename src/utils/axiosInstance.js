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

    const status = error.response?.status;
    // Handle both object with message and raw string responses
    const resData = error.response?.data;
    const errorMessage = (typeof resData === 'string' ? resData : resData?.message) || error.message || 'Unknown error';

    // DEBUG: Log 403 errors to help identify the exact message
    if (status === 403) {
      console.warn('⚠️ 403 Error Detected. Message:', errorMessage);
    }

    const lowerMsg = errorMessage.toLowerCase();

    // ✅ HANDLE SILENT 403s (Backend sends 403 with no message for expired tokens)
    const isSilent403 = status === 403 && (
      !resData ||
      (typeof resData === 'object' && Object.keys(resData).length === 0) ||
      errorMessage === 'Unknown error' ||
      lowerMsg.includes('request failed with status code 403')
    );

    // Check for Token Expiration (401 OR specific 403 messages)
    const isTokenExpired =
      status === 401 ||
      (status === 403 && (
        lowerMsg.includes('token') ||
        lowerMsg.includes('expired') ||
        lowerMsg.includes('signature') ||
        lowerMsg.includes('malformed') ||
        lowerMsg.includes('jwt') ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('access denied') ||
        lowerMsg.includes('unauthorized')
      )) ||
      isSilent403;

    if (isTokenExpired) {
      console.error('❌ Session Expired (Silent 403 or Explicit) - Redirecting to Login');

      // Clear ALL auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');

      // Force redirect to login
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // 403 - Forbidden (Permission issue, not Auth issue)
    if (status === 403) {
      console.error('❌ 403 Forbidden - User lacks permissions');
      return Promise.reject(new Error(errorMessage));
    }

    // 404 - Not Found
    if (status === 404) {
      console.error('❌ 404 Not Found');
      return Promise.reject(new Error('Resource not found.'));
    }

    // 400 - Bad Request
    if (status === 400) {
      console.error('❌ 400 Bad Request');
      return Promise.reject(new Error(errorMessage));
    }

    // 409 - Conflict
    if (status === 409) {
      console.error('❌ 409 Conflict');
      return Promise.reject(new Error(errorMessage));
    }

    // 500+ - Server Error
    if (status >= 500) {
      console.error('❌ Server Error:', status);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Network error
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject(new Error(`Network error. Cannot connect to ${API_CONFIG.BACKEND_URL}`));
    }

    // Generic error
    console.error('❌ API Error:', errorMessage);
    return Promise.reject(error);
  }
);

export default axiosInstance;