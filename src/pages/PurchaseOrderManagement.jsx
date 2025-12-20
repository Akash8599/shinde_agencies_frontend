import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './PurchaseOrderManagement.css';

function PurchaseOrderManagement() {
  const [currentView, setCurrentView] = useState('list');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(null);

  const [newPO, setNewPO] = useState({
    supplierName: '',
    items: [{ productId: '', quantity: 0, costPrice: 0, productName: '' }]
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchProducts();
  }, []);

  // Filter POs when search term changes
  useEffect(() => {
    filterPOs();
  }, [searchTerm, purchaseOrders]);

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

  // Filter POs by search term
  const filterPOs = () => {
    if (!searchTerm.trim()) {
      setFilteredPOs(purchaseOrders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = purchaseOrders.filter(po => {
      const poNum = (po.poNumber || '').toLowerCase();
      const supplier = (po.supplierName || '').toLowerCase();
      const status = (po.status || '').toLowerCase();

      return (
        poNum.includes(term) ||
        supplier.includes(term) ||
        status.includes(term)
      );
    });

    setFilteredPOs(filtered);
  };

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

      if (selectedItemIndex !== null) {
        const updatedItems = [...newPO.items];
        updatedItems[selectedItemIndex].productId = response.data.id;
        updatedItems[selectedItemIndex].productName = response.data.name;
        setNewPO({ ...newPO, items: updatedItems });
      }

      fetchProducts();

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

  // Get filtered products based on search term
  const getFilteredProducts = () => {
    if (!productSearchTerm.trim()) {
      return products;
    }
    
    const term = productSearchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    );
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ORDERED': return 'rgba(212, 175, 55, 0.8)';
      case 'RECEIVED': return 'rgba(16, 185, 129, 0.8)';
      case 'CANCELLED': return 'rgba(168, 178, 193, 0.8)';
      default: return 'rgba(212, 175, 55, 0.8)';
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

            {/* Search Section */}
            {purchaseOrders.length > 0 && (
              <div className="po-search-section">
                <div className="po-search-container">
                  <span className="po-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by PO number, supplier name, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="po-search-input"
                  />
                  {searchTerm && (
                    <button
                      className="po-search-clear-btn"
                      onClick={() => setSearchTerm('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading purchase orders...</p>
              </div>
            ) : filteredPOs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>{purchaseOrders.length === 0 ? 'No purchase orders yet' : 'No Results Found'}</h3>
                <p>{purchaseOrders.length === 0 ? 'Create your first purchase order to get started' : `No POs match "${searchTerm}"`}</p>
                {purchaseOrders.length === 0 && (
                  <button 
                    className="btn-create-po"
                    onClick={() => setCurrentView('create')}
                  >
                    Create First PO
                  </button>
                )}
              </div>
            ) : (
              <div className="po-grid">
                {filteredPOs.map((po) => (
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

            <div className="po-form-container">
              <div className="po-form-header">
                <h2>Create Purchase Order</h2>
                <p>Add a new purchase order with products from inventory or create new products</p>
              </div>

              <div className="po-form-section">
                <h3 className="section-title">Supplier Details</h3>
                <div className="po-supplier-form-group">
                  <label className="po-form-label">Supplier Name *</label>
                  <input
                    type="text"
                    className="po-supplier-input"
                    value={newPO.supplierName}
                    onChange={(e) => setNewPO({ ...newPO, supplierName: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>

              <div className="po-form-section">
                <div className="section-header">
                  <h3 className="section-title">Order Items</h3>
                  <button 
                    className="btn-add-item"
                    onClick={handleAddItem}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="po-items-container">
                  {newPO.items.map((item, index) => (
                    <div key={index} className="po-item-card">
                      <div className="po-item-number">Item {index + 1}</div>
                      
                      <div className="po-item-fields">
                        <div className="po-field-group">
                          <label className="po-form-label">Product *</label>
                          <div className="po-product-selector">
                            {showProductSearch === index ? (
                              <div className="po-product-search-dropdown">
                                <input
                                  type="text"
                                  className="po-product-search-input"
                                  placeholder="Search product name or SKU..."
                                  value={productSearchTerm}
                                  onChange={(e) => setProductSearchTerm(e.target.value)}
                                  autoFocus
                                />
                                <div className="po-product-list">
                                  {getFilteredProducts().length > 0 ? (
                                    getFilteredProducts().map((product) => (
                                      <button
                                        key={product.id}
                                        className="po-product-item"
                                        onClick={() => {
                                          handleUpdateItem(index, 'productId', product.id.toString());
                                          setShowProductSearch(null);
                                          setProductSearchTerm('');
                                        }}
                                      >
                                        <div className="po-product-item-name">{product.name}</div>
                                        <div className="po-product-item-sku">SKU: {product.sku}</div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="po-product-empty">No products found</div>
                                  )}
                                </div>
                                <button
                                  className="po-product-search-close"
                                  onClick={() => {
                                    setShowProductSearch(null);
                                    setProductSearchTerm('');
                                  }}
                                >
                                  ✕ Close
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className="po-product-select-btn"
                                  onClick={() => setShowProductSearch(index)}
                                >
                                  {item.productName || 'Select Product...'}
                                </button>
                              </>
                            )}
                            <button 
                              className="btn-create-product"
                              onClick={() => {
                                setSelectedItemIndex(index);
                                setShowNewProductModal(true);
                              }}
                              title="Create new product"
                            >
                              + New
                            </button>
                          </div>
                        </div>

                        <div className="po-field-group">
                          <label className="po-form-label">Quantity *</label>
                          <input
                            type="number"
                            className="po-form-input"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                            placeholder="Qty"
                          />
                        </div>

                        <div className="po-field-group">
                          <label className="po-form-label">Cost Price (per unit) *</label>
                          <input
                            type="number"
                            className="po-form-input"
                            min="0"
                            step="0.01"
                            value={item.costPrice || ''}
                            onChange={(e) => handleUpdateItem(index, 'costPrice', e.target.value)}
                            placeholder="₹0.00"
                          />
                        </div>

                        <div className="po-field-group">
                          <label className="po-form-label">Item Total</label>
                          <div className="po-item-total">
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

              <div className="po-form-summary">
                <div className="po-summary-card">
                  <div className="po-summary-item">
                    <span className="po-summary-label">Total Items</span>
                    <span className="po-summary-value">{newPO.items.length}</span>
                  </div>
                  <div className="po-summary-divider"></div>
                  <div className="po-summary-item">
                    <span className="po-summary-label">Grand Total</span>
                    <span className="po-summary-value total">₹{calculatePOTotal(newPO.items)}</span>
                  </div>
                </div>
              </div>

              <div className="po-form-actions">
                <button 
                  className="btn-po-create-final"
                  onClick={handleCreatePO}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Purchase Order'}
                </button>
                <button 
                  className="btn-po-cancel"
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
                <div className="po-items-table-wrapper">
                  <table className="po-items-table">
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
                          <td className="product-cell">{getProductName(item.productId)}</td>
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
                <span className="po-total-label">Grand Total</span>
                <span className="po-total-amount">₹{selectedPO.totalAmount.toFixed(2)}</span>
              </div>

              {selectedPO.status === 'ORDERED' && (
                <div className="po-detail-actions">
                  <button 
                    className="btn-po-receive"
                    onClick={() => handleReceivePO(selectedPO.id)}
                  >
                    ✓ Mark as Received
                  </button>
                  <button 
                    className="btn-po-cancel-order"
                    onClick={() => handleCancelPO(selectedPO.id)}
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showNewProductModal && (
          <div className="po-modal-overlay">
            <div className="po-product-modal">
              <div className="po-modal-header">
                <h3>Create New Product</h3>
                <button 
                  className="po-modal-close"
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

              <div className="po-modal-body">
                <div className="po-modal-form">
                  <div className="po-form-row">
                    <div className="po-form-group">
                      <label className="po-form-label">SKU *</label>
                      <input
                        type="text"
                        className="po-form-input"
                        value={newProductData.sku}
                        onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                        placeholder="e.g., PROD001"
                      />
                    </div>
                    <div className="po-form-group">
                      <label className="po-form-label">Product Name *</label>
                      <input
                        type="text"
                        className="po-form-input"
                        value={newProductData.name}
                        onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                        placeholder="e.g., Laptop"
                      />
                    </div>
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Description</label>
                    <textarea
                      className="po-form-input"
                      value={newProductData.description}
                      onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                      placeholder="Product description"
                      rows="2"
                    ></textarea>
                  </div>

                  <div className="po-form-row">
                    <div className="po-form-group">
                      <label className="po-form-label">Cost Price (₹) *</label>
                      <input
                        type="number"
                        className="po-form-input"
                        min="0"
                        step="0.01"
                        value={newProductData.costPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, costPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="po-form-group">
                      <label className="po-form-label">Selling Price (₹) *</label>
                      <input
                        type="number"
                        className="po-form-input"
                        min="0"
                        step="0.01"
                        value={newProductData.sellingPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, sellingPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="po-form-row">
                    <div className="po-form-group">
                      <label className="po-form-label">GST Rate (%)</label>
                      <select
                        className="po-form-input"
                        value={newProductData.gstRate}
                        onChange={(e) => setNewProductData({ ...newProductData, gstRate: e.target.value })}
                      >
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <div className="po-form-group">
                      <label className="po-form-label">Initial Quantity</label>
                      <input
                        type="number"
                        className="po-form-input"
                        min="0"
                        value={newProductData.quantity}
                        onChange={(e) => setNewProductData({ ...newProductData, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Low Stock Alert</label>
                    <input
                      type="number"
                      className="po-form-input"
                      min="0"
                      value={newProductData.lowStockAlert}
                      onChange={(e) => setNewProductData({ ...newProductData, lowStockAlert: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="po-modal-footer">
                <button 
                  className="btn-po-cancel-modal"
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
                  className="btn-po-create-product-final"
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