// File: frontend/src/config/api.js
// This file centralizes all API configuration with updated endpoints

const API_CONFIG = {
  // Backend API base URL
  // Change this based on your environment
  BACKEND_URL: process.env.REACT_APP_API_URL || 'http://192.168.31.118:8080',
  
  // API endpoints
  ENDPOINTS: {
    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    
    // ============================================
    // PRODUCT ENDPOINTS
    // ============================================
    PRODUCTS: '/api/products',
    PRODUCT_BY_ID: (id) => `/api/products/${id}`,
    CREATE_PRODUCT: '/api/products',
    UPDATE_PRODUCT: (id) => `/api/products/${id}`,
    DELETE_PRODUCT: (id) => `/api/products/${id}`,
    
    // ============================================
    // PURCHASE ORDER ENDPOINTS (from Suppliers)
    // ============================================
    PURCHASE_ORDERS: '/api/purchase-orders',
    PURCHASE_ORDER_BY_ID: (id) => `/api/purchase-orders/${id}`,
    CREATE_PURCHASE_ORDER: '/api/purchase-orders',
    UPDATE_PURCHASE_ORDER: (id) => `/api/purchase-orders/${id}`,
    DELETE_PURCHASE_ORDER: (id) => `/api/purchase-orders/${id}`,
    RECEIVE_PURCHASE_ORDER: (id) => `/api/purchase-orders/${id}/receive`,
    CANCEL_PURCHASE_ORDER: (id) => `/api/purchase-orders/${id}/cancel`,
    
    // ============================================
    // CUSTOMER ENDPOINTS (NEW)
    // ============================================
    CUSTOMERS: '/api/customers',
    CUSTOMER_BY_ID: (id) => `/api/customers/${id}`,
    CREATE_CUSTOMER: '/api/customers',
    UPDATE_CUSTOMER: (id) => `/api/customers/${id}`,
    DELETE_CUSTOMER: (id) => `/api/customers/${id}`,
    
    // ============================================
    // SALES ORDER ENDPOINTS (NEW)
    // For customer orders with GST billing
    // ============================================
    SALES_ORDERS: '/api/sales-orders',
    SALES_ORDER_BY_ID: (id) => `/api/sales-orders/${id}`,
    CREATE_SALES_ORDER: '/api/sales-orders',
    UPDATE_SALES_ORDER: (id) => `/api/sales-orders/${id}`,
    DELETE_SALES_ORDER: (id) => `/api/sales-orders/${id}`,
    
    // Sales Order Actions
    GENERATE_SALES_ORDER_INVOICE: (id) => `/api/sales-orders/${id}/invoice`,
    MARK_SALES_ORDER_PAID: (id) => `/api/sales-orders/${id}/mark-paid`,
    CANCEL_SALES_ORDER: (id) => `/api/sales-orders/${id}/cancel`,
    
    // ============================================
    // INVOICE ENDPOINTS (FUTURE)
    // ============================================
    INVOICES: '/api/invoices',
    INVOICE_BY_ID: (id) => `/api/invoices/${id}`,
    CREATE_INVOICE: '/api/invoices',
    GENERATE_INVOICE_PDF: (id) => `/api/invoices/${id}/generate-pdf`,
    SEND_INVOICE_EMAIL: (id) => `/api/invoices/${id}/send-email`,
    
    // ============================================
    // PAYMENT ENDPOINTS (FUTURE)
    // ============================================
    PAYMENTS: '/api/payments',
    CREATE_PAYMENT: '/api/payments',
    GET_PAYMENT_BY_ID: (id) => `/api/payments/${id}`,
    
    // ============================================
    // REPORT ENDPOINTS (FUTURE)
    // ============================================
    SALES_REPORT: '/api/reports/sales',
    REVENUE_REPORT: '/api/reports/revenue',
    INVENTORY_REPORT: '/api/reports/inventory',
    CUSTOMER_REPORT: '/api/reports/customers',
  },
  
  // ============================================
  // CONFIGURATION OPTIONS
  // ============================================
  
  // Timeout for API calls (in ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  },
  
  // ============================================
  // FEATURE FLAGS (Enable/Disable features)
  // ============================================
  FEATURES: {
    PRODUCTS: true,
    PURCHASE_ORDERS: true,
    CUSTOMERS: true,
    SALES_ORDERS: true,
    INVOICES: false, // Coming soon
    PAYMENTS: false, // Coming soon
    REPORTS: false, // Coming soon
  },
  
  // ============================================
  // DEFAULT VALUES
  // ============================================
  DEFAULTS: {
    DEFAULT_GST_RATE: 18, // Default GST rate in percentage
    DEFAULT_PAGE_SIZE: 10,
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '₹',
  },
  
  // ============================================
  // ERROR MESSAGES
  // ============================================
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You are not authorized. Please login again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    INVENTORY_ERROR: 'Insufficient inventory for this product.',
  },
};

export default API_CONFIG;