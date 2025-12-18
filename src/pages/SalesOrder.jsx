import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import InvoiceGenerator from './InvoiceGenerator';
import './SalesOrder.css';

const SalesOrder = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);

  // Fetch all sales orders
  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Filter orders when search term changes
  useEffect(() => {
    filterOrders();
  }, [searchTerm, salesOrders]);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/sales-orders');
      console.log('✅ Sales orders fetched:', response.data);

      // Sort by latest first (by ID or date)
      const sorted = Array.isArray(response.data)
        ? response.data.sort((a, b) => (b.id || 0) - (a.id || 0))
        : [];

      setSalesOrders(sorted);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching sales orders:', err);
      setError('Failed to load sales orders');
      setSalesOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search term
  const filterOrders = () => {
    if (!searchTerm.trim()) {
      setFilteredOrders(salesOrders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = salesOrders.filter(order => {
      const orderNum = (order.orderNumber || '').toLowerCase();
      const custName = (order.customerName || '').toLowerCase();
      const custPhone = (order.customerPhone || '').toLowerCase();
      const custEmail = (order.customerEmail || '').toLowerCase();

      return (
        orderNum.includes(term) ||
        custName.includes(term) ||
        custPhone.includes(term) ||
        custEmail.includes(term)
      );
    });

    setFilteredOrders(filtered);
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  // Handle print invoice
  const handlePrintInvoice = (orderId) => {
    setInvoiceOrderId(orderId);
    setShowInvoice(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setSelectedOrder(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate order total
  const calculateOrderTotal = (items = []) => {
    let subtotal = 0;
    let tax = 0;

    items.forEach(item => {
      const itemSubtotal = (item.quantity || 0) * (item.sellingPrice || 0);
      const itemTax = (itemSubtotal * (item.gstRate || 18)) / 100;
      subtotal += itemSubtotal;
      tax += itemTax;
    });

    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  return (
    <div className="sales-order-container-futuristic">
      {/* Header */}
      <div className="so-header-futuristic">
        <div className="so-title-section">
          <h1 className="so-main-title">
            <span className="title-icon">📋</span>
            <span className="title-text">Sales Orders</span>
          </h1>
          <p className="so-subtitle">View and manage all customer orders</p>
        </div>
        <div className="so-stats">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <p className="stat-label">Total Orders</p>
              <p className="stat-value">{salesOrders.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div>
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">
                ₹{salesOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error-futuristic">{error}</div>}
      {success && <div className="alert alert-success-futuristic">{success}</div>}

      {/* Search Bar */}
      <div className="so-search-section">
        <div className="search-container-futuristic">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order #, customer name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-futuristic"
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results">
          Showing {filteredOrders.length} of {salesOrders.length} orders
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-container-futuristic">
          <div className="spinner-futuristic"></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state-futuristic">
          <span className="empty-icon">📭</span>
          <p className="empty-title">
            {salesOrders.length === 0 ? 'No Orders Yet' : 'No Results Found'}
          </p>
          <p className="empty-text">
            {salesOrders.length === 0
              ? 'Create your first sales order from the Shop tab'
              : `No orders match "${searchTerm}"`}
          </p>
        </div>
      ) : (
        <div className="orders-grid-futuristic">
          {filteredOrders.map((order) => {
            const totals = calculateOrderTotal(order.items);
            const itemCount = (order.items || []).length;
            
            return (
              <div key={order.id} className="order-card-futuristic">
                {/* Card Header */}
                <div className="order-card-header">
                  <div className="order-number-badge">
                    <span className="badge-label">Order #</span>
                    <span className="badge-value">{order.orderNumber || 'N/A'}</span>
                  </div>
                  <div className="order-status">
                    <span className="status-badge status-completed">✓ Completed</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="order-customer-info">
                  <div className="info-row">
                    <span className="info-label">👤 Customer</span>
                    <span className="info-value">{order.customerName || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📱 Phone</span>
                    <span className="info-value">{order.customerPhone || 'N/A'}</span>
                  </div>
                  {order.customerEmail && (
                    <div className="info-row">
                      <span className="info-label">📧 Email</span>
                      <span className="info-value">{order.customerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Order Details - Improved */}
                <div className="order-details">
                  <div className="detail-item detail-items-expandable">
                    <span className="detail-label">Items</span>
                    <span className="detail-value">{itemCount}</span>
                    {itemCount > 0 && (
                      <div className="items-preview">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div key={idx} className="item-preview-row">
                            <span className="item-preview-name">{item.productName || `Product ${item.productId}`}</span>
                            <span className="item-preview-qty">×{item.quantity}</span>
                          </div>
                        ))}
                        {itemCount > 3 && (
                          <div className="item-preview-more">+{itemCount - 3} more...</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date</span>
                    <span className="detail-value detail-date">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="order-amount">
                  <div className="amount-breakdown">
                    <div className="amount-row">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Tax</span>
                      <span>₹{totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="amount-row total">
                      <span>Total</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="order-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewOrder(order)}
                    title="View Details"
                  >
                    <span className="btn-icon">👁️</span>
                    <span className="btn-text">View</span>
                  </button>
                  <button
                    className="action-btn invoice-btn"
                    onClick={() => handlePrintInvoice(order.id)}
                    title="Print Invoice"
                  >
                    <span className="btn-icon">🧾</span>
                    <span className="btn-text">Invoice</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay-futuristic" onClick={closeDetailsModal}>
          <div className="modal-content-futuristic" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeDetailsModal}>✕</button>

            <div className="modal-header-futuristic">
              <h2>Order #{selectedOrder.orderNumber}</h2>
            </div>

            <div className="modal-body-futuristic">
              {/* Customer Section */}
              <div className="modal-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-field">
                    <label>Name</label>
                    <p>{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div className="info-field">
                    <label>Phone</label>
                    <p>{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                  <div className="info-field">
                    <label>Email</label>
                    <p>{selectedOrder.customerEmail || 'N/A'}</p>
                  </div>
                  <div className="info-field">
                    <label>Address</label>
                    <p>{selectedOrder.customerAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Items Section - Now showing Product Name */}
              <div className="modal-section">
                <h3>Order Items</h3>
                <div className="items-list">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="item-row">
                      <div className="item-details">
                        <p className="item-name">{item.productName || `Product ${item.productId}`}</p>
                        <p className="item-desc">Qty: {item.quantity} × ₹{(item.sellingPrice || 0).toFixed(0)}</p>
                      </div>
                      <div className="item-total">
                        ₹{((item.quantity || 0) * (item.sellingPrice || 0)).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="modal-section">
                <div className="summary-box">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{calculateOrderTotal(selectedOrder.items).subtotal.toFixed(0)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax (GST)</span>
                    <span>₹{calculateOrderTotal(selectedOrder.items).tax.toFixed(0)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>₹{calculateOrderTotal(selectedOrder.items).total.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-futuristic">
              <button
                className="modal-btn invoice-modal-btn"
                onClick={() => {
                  handlePrintInvoice(selectedOrder.id);
                  closeDetailsModal();
                }}
              >
                🧾 Print Invoice
              </button>
              <button className="modal-btn close-modal-btn" onClick={closeDetailsModal}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && invoiceOrderId && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-container">
            <button
              className="invoice-close-btn"
              onClick={() => setShowInvoice(false)}
            >
              ✕
            </button>
            <InvoiceGenerator
              orderId={invoiceOrderId}
              onClose={() => setShowInvoice(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrder;