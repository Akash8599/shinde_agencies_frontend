import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './PurchaseOrderManagement.css';

function PurchaseOrderManagement() {
  const [currentView, setCurrentView] = useState('list');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ════════════════════════════════════════════════════════════════════════
  // ✅ NEW: State for creating new product while creating PO
  // ════════════════════════════════════════════════════════════════════════
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    gstRate: '18',
    quantity: '0',
    lowStockAlert: '10'
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const [newPO, setNewPO] = useState({
    supplierName: '',
    items: [{ productId: '', quantity: 0, costPrice: 0, productName: '' }]
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchProducts();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.PURCHASE_ORDERS);
      setPurchaseOrders(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching POs:', err);
      setError(`Failed to fetch purchase orders: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.PRODUCTS);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(`Failed to fetch products: ${err.response?.data?.message || err.message}`);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Create product inline
  // ════════════════════════════════════════════════════════════════════════
  const handleCreateProduct = async () => {
    try {
      if (!newProductData.sku || !newProductData.name) {
        setError('Please fill in SKU and product name');
        return;
      }

      setCreatingProduct(true);

      const payload = {
        sku: newProductData.sku.trim(),
        name: newProductData.name.trim(),
        description: newProductData.description.trim(),
        costPrice: parseFloat(newProductData.costPrice) || 0,
        sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
        gstRate: parseFloat(newProductData.gstRate),
        quantity: parseInt(newProductData.quantity) || 0,
        lowStockAlert: parseInt(newProductData.lowStockAlert) || 10
      };

      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.CREATE_PRODUCT, payload);

      setSuccess(`✓ Product "${response.data.name}" created successfully!`);

      // Add the new product to the item
      if (selectedItemIndex !== null) {
        const updatedItems = [...newPO.items];
        updatedItems[selectedItemIndex].productId = response.data.id;
        updatedItems[selectedItemIndex].productName = response.data.name;
        setNewPO({ ...newPO, items: updatedItems });
      }

      // Refresh products list
      fetchProducts();

      // Reset form and close modal
      setNewProductData({
        sku: '',
        name: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        gstRate: '18',
        quantity: '0',
        lowStockAlert: '10'
      });
      setShowNewProductModal(false);
      setSelectedItemIndex(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleCreatePO = async () => {
    try {
      if (!newPO.supplierName.trim()) {
        setError('Please enter supplier name');
        return;
      }

      if (newPO.items.some(item => !item.productId || item.quantity <= 0 || item.costPrice <= 0)) {
        setError('Please fill all item details correctly');
        return;
      }

      setLoading(true);

      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.CREATE_PURCHASE_ORDER, newPO);

      setSuccess(`✓ Purchase Order created: ${response.data.poNumber}`);
      setNewPO({
        supplierName: '',
        items: [{ productId: '', quantity: 0, costPrice: 0, productName: '' }]
      });

      fetchPurchaseOrders();
      setCurrentView('list');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating PO:', err);
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewPO({
      ...newPO,
      items: [...newPO.items, { productId: '', quantity: 0, costPrice: 0, productName: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newPO.items.filter((_, i) => i !== index);
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...newPO.items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      updatedItems[index].productId = parseInt(value);
      updatedItems[index].productName = product ? product.name : '';
    } else {
      updatedItems[index][field] = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
    }
    
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleReceivePO = async (poId) => {
    try {
      setLoading(true);
      await axiosInstance.post(API_CONFIG.ENDPOINTS.RECEIVE_PURCHASE_ORDER(poId));
      setSuccess('✓ Purchase order received successfully');
      fetchPurchaseOrders();
      setCurrentView('list');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error receiving PO:', err);
      setError(err.response?.data?.message || 'Failed to receive purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPO = async (poId) => {
    if (window.confirm('Are you sure you want to cancel this purchase order?')) {
      try {
        setLoading(true);
        await axiosInstance.post(API_CONFIG.ENDPOINTS.CANCEL_PURCHASE_ORDER(poId));
        setSuccess('✓ Purchase order cancelled');
        fetchPurchaseOrders();
        setCurrentView('list');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error cancelling PO:', err);
        setError(err.response?.data?.message || 'Failed to cancel purchase order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewPO = (po) => {
    setSelectedPO(po);
    setCurrentView('view');
  };

  const calculateItemTotal = (quantity, costPrice) => {
    return (quantity * costPrice).toFixed(2);
  };

  const calculatePOTotal = (items) => {
    return items.reduce((total, item) => total + (item.quantity * item.costPrice), 0).toFixed(2);
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ORDERED': return '#FF6B6B';
      case 'RECEIVED': return '#51CF66';
      case 'CANCELLED': return '#868E96';
      default: return '#495057';
    }
  };

  return (
    <div className="purchase-order-management">
      <div className="po-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {currentView === 'list' && (
          <div className="po-list-view">
            <div className="po-header-section">
              <div className="po-header-content">
                <h1>📦 Purchase Orders</h1>
                <p className="po-subtitle">Manage supplier purchases and inventory</p>
              </div>
              <button 
                className="btn-create-po"
                onClick={() => setCurrentView('create')}
              >
                <span className="btn-icon">+</span>
                Create PO
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading purchase orders...</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No purchase orders yet</h3>
                <p>Create your first purchase order to get started</p>
                <button 
                  className="btn-create-po"
                  onClick={() => setCurrentView('create')}
                >
                  Create First PO
                </button>
              </div>
            ) : (
              <div className="po-grid">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="po-card">
                    <div className="po-card-header">
                      <div>
                        <h3 className="po-number">{po.poNumber}</h3>
                        <p className="po-supplier">{po.supplierName}</p>
                      </div>
                      <span 
                        className="po-status"
                        style={{ backgroundColor: getStatusColor(po.status) }}
                      >
                        {po.status}
                      </span>
                    </div>

                    <div className="po-card-body">
                      <div className="po-info">
                        <div className="info-item">
                          <span className="label">Items</span>
                          <span className="value">{po.items ? po.items.length : 0}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Amount</span>
                          <span className="value amount">₹{po.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Date</span>
                          <span className="value">{new Date(po.orderDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="po-card-footer">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleViewPO(po)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                      {po.status === 'ORDERED' && (
                        <>
                          <button 
                            className="action-btn receive-btn"
                            onClick={() => handleReceivePO(po.id)}
                            title="Mark as Received"
                          >
                            ✓ Receive
                          </button>
                          <button 
                            className="action-btn cancel-btn"
                            onClick={() => handleCancelPO(po.id)}
                            title="Cancel"
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'create' && (
          <div className="po-create-view">
            <button 
              className="btn-back"
              onClick={() => {
                setCurrentView('list');
                setNewPO({
                  supplierName: '',
                  items: [{ productId: '', quantity: 0, costPrice: 0, productName: '' }]
                });
              }}
            >
              ← Back
            </button>

            <div className="create-form-container">
              <div className="create-form-header">
                <h2>Create Purchase Order</h2>
                <p>Add a new purchase order with products from inventory or create new products</p>
              </div>

              <div className="form-section">
                <h3 className="section-title">Supplier Details</h3>
                <div className="form-group">
                  <label className="form-label">Supplier Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPO.supplierName}
                    onChange={(e) => setNewPO({ ...newPO, supplierName: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Order Items</h3>
                  <button 
                    className="btn-add-item"
                    onClick={handleAddItem}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="items-container">
                  {newPO.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-number">Item {index + 1}</div>
                      
                      <div className="item-fields">
                        <div className="field-group">
                          <label className="form-label">Product *</label>
                          <div className="product-selector">
                            <select
                              className="form-input product-select"
                              value={item.productId}
                              onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                            >
                              <option value="">Select existing product...</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} (SKU: {product.sku})
                                </option>
                              ))}
                            </select>
                            <button 
                              className="btn-create-product"
                              onClick={() => {
                                setSelectedItemIndex(index);
                                setShowNewProductModal(true);
                              }}
                              title="Create new product"
                            >
                              + New Product
                            </button>
                          </div>
                        </div>

                        <div className="field-group">
                          <label className="form-label">Quantity *</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                            placeholder="Qty"
                          />
                        </div>

                        <div className="field-group">
                          <label className="form-label">Cost Price (per unit) *</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="0.01"
                            value={item.costPrice || ''}
                            onChange={(e) => handleUpdateItem(index, 'costPrice', e.target.value)}
                            placeholder="₹0.00"
                          />
                        </div>

                        <div className="field-group">
                          <label className="form-label">Item Total</label>
                          <div className="item-total">
                            ₹{calculateItemTotal(item.quantity, item.costPrice)}
                          </div>
                        </div>

                        {newPO.items.length > 1 && (
                          <button 
                            className="btn-remove-item"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-summary">
                <div className="summary-card">
                  <div className="summary-item">
                    <span className="summary-label">Total Items</span>
                    <span className="summary-value">{newPO.items.length}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-item">
                    <span className="summary-label">Grand Total</span>
                    <span className="summary-value total">₹{calculatePOTotal(newPO.items)}</span>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-create-final"
                  onClick={handleCreatePO}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Purchase Order'}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setCurrentView('list');
                    setNewPO({
                      supplierName: '',
                      items: [{ productId: '', quantity: 0, costPrice: 0, productName: '' }]
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'view' && selectedPO && (
          <div className="po-view">
            <button 
              className="btn-back"
              onClick={() => setCurrentView('list')}
            >
              ← Back
            </button>

            <div className="po-detail-container">
              <div className="po-detail-header">
                <div>
                  <h2 className="po-title">{selectedPO.poNumber}</h2>
                  <p className="po-meta">
                    <span>{selectedPO.supplierName}</span>
                    <span>•</span>
                    <span>{new Date(selectedPO.orderDate).toLocaleDateString()}</span>
                  </p>
                </div>
                <span 
                  className="po-status-large"
                  style={{ backgroundColor: getStatusColor(selectedPO.status) }}
                >
                  {selectedPO.status}
                </span>
              </div>

              <div className="po-detail-items">
                <h3>Order Items</h3>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Cost Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items && selectedPO.items.map((item, index) => (
                        <tr key={index}>
                          <td className="product-cell">{getProductName(item.product?.id)}</td>
                          <td className="number-cell">{item.quantity}</td>
                          <td className="number-cell">₹{item.costPrice.toFixed(2)}</td>
                          <td className="number-cell total-cell">₹{(item.quantity * item.costPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="po-detail-total">
                <span className="total-label">Grand Total</span>
                <span className="total-amount">₹{selectedPO.totalAmount.toFixed(2)}</span>
              </div>

              {selectedPO.status === 'ORDERED' && (
                <div className="po-detail-actions">
                  <button 
                    className="btn-receive"
                    onClick={() => handleReceivePO(selectedPO.id)}
                  >
                    ✓ Mark as Received
                  </button>
                  <button 
                    className="btn-cancel-po"
                    onClick={() => handleCancelPO(selectedPO.id)}
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ✅ NEW: Product Creation Modal
            ════════════════════════════════════════════════════════════════ */}
        {showNewProductModal && (
          <div className="modal-overlay">
            <div className="product-modal">
              <div className="modal-header">
                <h3>Create New Product</h3>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowNewProductModal(false);
                    setSelectedItemIndex(null);
                    setNewProductData({
                      sku: '',
                      name: '',
                      description: '',
                      costPrice: '',
                      sellingPrice: '',
                      gstRate: '18',
                      quantity: '0',
                      lowStockAlert: '10'
                    });
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">SKU *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newProductData.sku}
                        onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                        placeholder="e.g., PROD001"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Product Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newProductData.name}
                        onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                        placeholder="e.g., Laptop"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      value={newProductData.description}
                      onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                      placeholder="Product description"
                      rows="2"
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cost Price (₹) *</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        step="0.01"
                        value={newProductData.costPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, costPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Selling Price (₹) *</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        step="0.01"
                        value={newProductData.sellingPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, sellingPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">GST Rate (%)</label>
                      <select
                        className="form-input"
                        value={newProductData.gstRate}
                        onChange={(e) => setNewProductData({ ...newProductData, gstRate: e.target.value })}
                      >
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={newProductData.quantity}
                        onChange={(e) => setNewProductData({ ...newProductData, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Low Stock Alert</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={newProductData.lowStockAlert}
                      onChange={(e) => setNewProductData({ ...newProductData, lowStockAlert: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-cancel-modal"
                  onClick={() => {
                    setShowNewProductModal(false);
                    setSelectedItemIndex(null);
                    setNewProductData({
                      sku: '',
                      name: '',
                      description: '',
                      costPrice: '',
                      sellingPrice: '',
                      gstRate: '18',
                      quantity: '0',
                      lowStockAlert: '10'
                    });
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-create-product-final"
                  onClick={handleCreateProduct}
                  disabled={creatingProduct}
                >
                  {creatingProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrderManagement;