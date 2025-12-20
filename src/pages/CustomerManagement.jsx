import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ DELETE MODAL STATE
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '' // ✅ NEW: GSTIN/UIN field
  });

  // Check auth status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setError('No authentication token. Please login first.');
      return false;
    }

    return true;
  };

  // Fetch all customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      if (!checkAuthStatus()) {
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.CUSTOMERS);
      setCustomers(response.data);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load customers';

      if (err.response?.status === 403) {
        setError('🔒 ACCESS DENIED (403): You do not have permission to view customers.');
      } else if (err.response?.status === 401) {
        setError('🔐 UNAUTHORIZED (401): Your session has expired. Please login again.');
      } else {
        setError(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    checkAuthStatus();
    fetchCustomers();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      statecode: '',
      pincode: '',
      gstin: '' // ✅ Reset GSTIN
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Handle create/update customer
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone (at least 10 digits)
    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    try {
      if (!checkAuthStatus()) {
        return;
      }

      const endpoint = editingId
        ? API_CONFIG.ENDPOINTS.UPDATE_CUSTOMER(editingId)
        : API_CONFIG.ENDPOINTS.CREATE_CUSTOMER;

      if (editingId) {
        await axiosInstance.put(endpoint, formData);
        setSuccess('✅ Customer updated successfully!');
      } else {
        await axiosInstance.post(endpoint, formData);
        setSuccess('✅ Customer added successfully!');
      }

      fetchCustomers();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save customer';

      if (err.response?.status === 403) {
        setError('🔒 ACCESS DENIED (403): You do not have permission to perform this action.');
      } else if (err.response?.status === 401) {
        setError('🔐 UNAUTHORIZED (401): Your session has expired. Please login again.');
      } else if (err.response?.status === 400) {
        setError(`⚠️ BAD REQUEST (400): ${errorMsg}`);
      } else {
        setError(`❌ Error: ${errorMsg}`);
      }
    }
  };

  // Handle edit customer
  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gstin: customer.gstin || '', // ✅ Load GSTIN
      statecode: customer.statecode || ''
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  // ✅ MODIFIED: Open delete modal instead of immediate delete
  const openDeleteModal = (customer) => {
    setDeleteTarget(customer);
    setShowDeleteModal(true);
  };

  // ✅ MODIFIED: Confirm delete with modal
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (!checkAuthStatus()) {
        setIsDeleting(false);
        return;
      }

      await axiosInstance.delete(API_CONFIG.ENDPOINTS.DELETE_CUSTOMER(deleteTarget.id));
      setSuccess('✅ Customer deleted successfully!');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete customer';

      if (err.response?.status === 403) {
        setError('🔒 ACCESS DENIED (403): You do not have permission to delete customers.');
      } else if (err.response?.status === 401) {
        setError('🔐 UNAUTHORIZED (401): Please login again.');
      } else {
        setError(`Error: ${errorMsg}`);
      }

      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Filter customers by search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="customer-management">
      {/* ✅ ENHANCED HEADER */}
      <div className="cm-header">
        <div className="header-content">
          <h1 className="cm-title">
            <span className="cm-icon">👥</span>
            <span className="cm-text">Customer Management</span>
          </h1>

          <p className="cm-subtitle">Manage and organize your customer information</p>
        </div>
        <button
          className="btn-add-customer"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <span className="btn-icon">➕</span> Add New Customer
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {error}
          </div>
        </div>
      )}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ✅ ENHANCED FORM */}
      {showForm && (
        <div className="customer-form-container">
          <div className="customer-form-card">
            <h2>{editingId ? '✏️ Edit Customer' : '➕ Add New Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div className="customer-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210"
                    required
                  />
                </div>
                <div className="customer-form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City name"
                    required
                  />
                </div>
              </div>

              {/* ✅ NEW: GSTIN/UIN Field */}
              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label>GSTIN/UIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    placeholder="e.g., 27ABCDE1234F1Z5"
                    maxLength="15"
                  />
                  <small className="field-hint">GST Registration or Unique ID Number</small>
                </div>
                <div className="customer-form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g., Maharashtra"
                    required
                  />
                </div>
              </div>

              <div className="customer-form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  rows="2"
                />
              </div>

                <div className="customer-form-row">
                  <div className="customer-form-group">
                    <label>StateCode *</label>
                    <input
                      type="text"
                      name="statecode"
                      value={formData.statecode}
                      onChange={handleInputChange}
                      placeholder="e.g., 27"
                      required
                    />
                  </div>
                </div>

                <div className="customer-form-row">
                  <div className="customer-form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g., 413102"
                      required
                    />
                  </div>
                </div>

                <div className="customer-form-actions">
                  <button type="submit" className="btn-customer-submit">
                    {editingId ? '💾 Update Customer' : '✅ Add Customer'}
                  </button>
                  <button type="button" className="btn-customer-cancel" onClick={resetForm}>
                    ❌ Cancel
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="customer-delete-modal-overlay">
          <div className="customer-delete-modal">
            <div className="delete-modal-icon">🗑️</div>
            <h3>Delete Customer?</h3>
            <p className="delete-confirmation-text">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p className="delete-warning-text">
              ⚠️ This action cannot be undone. All customer data will be permanently deleted.
            </p>

            <div className="delete-customer-details">
              <div className="detail-item">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{deleteTarget.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">{deleteTarget.phone}</span>
              </div>
              {deleteTarget.city && (
                <div className="detail-item">
                  <span className="detail-label">🏙️ City:</span>
                  <span className="detail-value">{deleteTarget.city}</span>
                </div>
              )}
              {deleteTarget.gstin && (
                <div className="detail-item">
                  <span className="detail-label">🔢 GSTIN:</span>
                  <span className="detail-value">{deleteTarget.gstin}</span>
                </div>
              )}
            </div>

            <div className="customer-delete-modal-actions">
              <button
                className="btn-customer-confirm-delete"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete Customer'}
              </button>
              <button
                className="btn-customer-cancel-delete"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ENHANCED SEARCH */}
      <div className="customer-search-container">
        <div className="customer-search-wrapper">
          <input
            type="text"
            placeholder="🔍 Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="customer-search-input"
          />
        </div>
        <span className="result-count">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {loading ? (
        <div className="loading">⏳ Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="no-customers">
          <p>📋 No customers found. {!showForm && <a onClick={() => setShowForm(true)}>Add your first customer</a>}</p>
        </div>
      ) : (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>City</th>
                <th>State</th>
                <th>State Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="name">{customer.name}</td>
                  <td className="email">{customer.email}</td>
                  <td className="phone">{customer.phone}</td>
                  <td className="gstin">{customer.gstin || '-'}</td>
                  <td className="city">{customer.city || '-'}</td>
                  <td className="state">{customer.state || '-'}</td>
                  <td className="state-code">{customer.statecode || '-'}</td>
                  <td className="actions">
                    <button
                      className="btn-customer-edit"
                      onClick={() => handleEdit(customer)}
                      title="Edit customer"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-customer-delete"
                      onClick={() => openDeleteModal(customer)}
                      title="Delete customer"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;