import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pm-theme');
    return saved || 'dark';
  });
  
  // ════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Delete Modal with smart messages for used products
  // ════════════════════════════════════════════════════════════════════════
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    isUsedInOrders: false,
    usageCount: 0,
    isDeleting: false
  });

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    gstRate: '18',
    quantity: '',
    lowStockAlert: '10'
  });

  // Set theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('pm-theme', theme);
  }, [theme]);

  // ════════════════════════════════════════════════════════════════════════
  // ✅ UPDATED: Fetch all products (filters inactive by backend)
  // ════════════════════════════════════════════════════════════════════════
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.PRODUCTS);
      // Backend returns only isActive = true products
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Clear alerts after 4 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
      sku: '',
      name: '',
      description: '',
      costPrice: '',
      sellingPrice: '',
      gstRate: '18',
      quantity: '',
      lowStockAlert: '10'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Handle create/update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.sku || !formData.name || !formData.costPrice || !formData.sellingPrice || !formData.quantity) {
      setError('Please fill all required fields');
      return;
    }

    const costPrice = parseFloat(formData.costPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    const quantity = parseInt(formData.quantity);
    const gstRate = parseFloat(formData.gstRate);

    if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
      setError('Invalid numeric values');
      return;
    }

    if (sellingPrice < costPrice) {
      setError('Selling price must be greater than cost price');
      return;
    }

    if (quantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    try {
      const payload = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        costPrice,
        sellingPrice,
        gstRate,
        quantity,
        lowStockAlert: parseInt(formData.lowStockAlert) || 10
      };

      if (editingId) {
        // Update product
        await axiosInstance.put(API_CONFIG.ENDPOINTS.UPDATE_PRODUCT(editingId), payload);
        setSuccess('✓ Product updated successfully!');
      } else {
        // Create product
        await axiosInstance.post(API_CONFIG.ENDPOINTS.CREATE_PRODUCT, payload);
        setSuccess('✓ Product added successfully!');
      }

      fetchProducts();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  // Handle edit product
  const handleEdit = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      gstRate: product.gstRate.toString(),
      quantity: product.quantity.toString(),
      lowStockAlert: product.lowStockAlert.toString()
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  // ════════════════════════════════════════════════════════════════════════
  // ✅ UPDATED: Handle delete product click - Check if used in orders
  // ════════════════════════════════════════════════════════════════════════
  const handleDeleteClick = (productId, productName) => {
    // Show delete modal with info
    // Backend will handle checking if product is used
    setDeleteModal({
      isOpen: true,
      productId,
      productName,
      isUsedInOrders: false,
      usageCount: 0,
      isDeleting: false
    });
  };

  // ════════════════════════════════════════════════════════════════════════
  // ✅ UPDATED: Confirm delete - Handle soft delete & force delete
  // ════════════════════════════════════════════════════════════════════════
  const confirmDelete = async () => {
    const { productId, productName } = deleteModal;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await axiosInstance.delete(API_CONFIG.ENDPOINTS.DELETE_PRODUCT(productId));
      
      setSuccess(`✓ "${productName}" deleted successfully!`);
      fetchProducts();
      setDeleteModal({ 
        isOpen: false, 
        productId: null, 
        productName: '',
        isUsedInOrders: false,
        usageCount: 0,
        isDeleting: false
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product';
      
      // ✅ NEW: Handle smart delete error messages
      if (errorMessage.includes('used in') || errorMessage.includes('sales order')) {
        // Product is used in orders - it was soft deleted
        setSuccess(`✓ Product marked as inactive (hidden from new orders). Historical data preserved.`);
        fetchProducts();
        setDeleteModal({ 
          isOpen: false, 
          productId: null, 
          productName: '',
          isUsedInOrders: false,
          usageCount: 0,
          isDeleting: false
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModal({ 
      isOpen: false, 
      productId: null, 
      productName: '',
      isUsedInOrders: false,
      usageCount: 0,
      isDeleting: false
    });
  };

  // Filter products by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="product-management">
      <div className="pm-header">
        <h1>Product Management</h1>
        <button 
          className="btn-add-product"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          title="Add a new product"
        >
          + Add New Product
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="form-container">
          <div className="form-card">
            <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sku">SKU (Product Code) *</label>
                  <input
                    id="sku"
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g., PROD001"
                    disabled={editingId !== null}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Hammer"
                    required
                  />
                </div>
              </div>

              <div className="form-group form-row full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product details (optional)"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="costPrice">Cost Price (₹) *</label>
                  <input
                    id="costPrice"
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sellingPrice">Selling Price (₹) *</label>
                  <input
                    id="sellingPrice"
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gstRate">GST Rate (%)</label>
                  <select
                    id="gstRate"
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleInputChange}
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Initial Quantity *</label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lowStockAlert">Low Stock Alert</label>
                  <input
                    id="lowStockAlert"
                    type="number"
                    name="lowStockAlert"
                    value={formData.lowStockAlert}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? '✓ Update Product' : '+ Add Product'}
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Search products"
        />
        <span className="result-count">{filteredProducts.length} results</span>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">
          <p>No products found. {products.length === 0 && <a onClick={() => setShowForm(true)}>Add your first product</a>}</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>GST</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const profit = product.sellingPrice - product.costPrice;
                const margin = ((profit / product.costPrice) * 100).toFixed(2);
                const isLowStock = product.quantity <= product.lowStockAlert;

                return (
                  <tr key={product.id} className={isLowStock ? 'low-stock-row' : ''} style={{
                    animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`
                  }}>
                    <td className="sku">{product.sku}</td>
                    <td className="name">{product.name}</td>
                    <td className="price">₹{product.costPrice.toFixed(2)}</td>
                    <td className="price">₹{product.sellingPrice.toFixed(2)}</td>
                    <td className="profit">₹{profit.toFixed(2)}</td>
                    <td className="margin">{margin}%</td>
                    <td className="gst">{product.gstRate}%</td>
                    <td className={`quantity ${isLowStock ? 'alert' : ''}`}>
                      {product.quantity}
                      {isLowStock && <span className="alert-badge">⚠️</span>}
                    </td>
                    <td className="status">
                      <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(product)}
                        title="Edit this product"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(product.id, product.name)}
                        title="Delete this product"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL - UPDATED
          Shows smart messages for soft delete vs hard delete
          ════════════════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Delete Product?</h3>
              <button 
                className="modal-close"
                onClick={cancelDelete}
                title="Cancel"
                disabled={deleteModal.isDeleting}
              >
                ✕
              </button>
            </div>
            
            <div className="delete-modal-body">
              <p>
                Are you sure you want to delete <strong>"{deleteModal.productName}"</strong>?
              </p>
              
              {/* ✅ NEW: Smart delete message based on product usage */}
              <div className="delete-info-box">
                <p className="info-text">
                  💡 <strong>What happens:</strong>
                </p>
                <ul className="info-list">
                  <li>✅ Old orders & invoices will remain intact</li>
                  <li>✅ Order history is preserved with product snapshots</li>
                  <li>✅ This product will be hidden from new orders</li>
                  <li>✅ You can reactivate it later if needed</li>
                </ul>
              </div>
              
              <p className="warning-text">
                ⚠️ This action cannot be undone.
              </p>
            </div>
            
            <div className="delete-modal-footer">
              <button 
                className="btn-cancel-delete"
                onClick={cancelDelete}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? 'Processing...' : 'No, Keep It'}
              </button>
              <button 
                className="btn-confirm-delete"
                onClick={confirmDelete}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? '⏳ Deleting...' : 'Yes, Delete It'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default ProductManagement;