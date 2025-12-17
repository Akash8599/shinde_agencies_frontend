import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import InvoiceGenerator from './InvoiceGenerator';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState({});
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Custom prices for products (productId -> price)
  const [customPrices, setCustomPrices] = useState({});

  // ✅ CUSTOMER MANAGEMENT
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Customer info for sales order
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    city: '',
    state: '',
    statecode: ''
  });

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    city: '',
    state: '',
    pincode: '',
    statecode: ''
  });

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/api/products');
      console.log('✅ Products loaded:', response.data);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch all customers
  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const response = await axiosInstance.get('/api/customers');
      setCustomers(response.data);
      console.log('✅ Customers loaded:', response.data.length, 'items');
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
    } finally {
      setCustomerLoading(false);
    }
  };

  // ✅ Create new customer
  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    setError('');

    if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
      setError('Please fill required fields (Name, Phone, Email)');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/customers', newCustomer);
      setSuccess('✅ Customer created successfully!');
      
      // Add new customer to list and select it
      setCustomers([...customers, response.data]);
      setSelectedCustomerId(response.data.id);
      setCustomerInfo({
        name: response.data.name,
        phone: response.data.phone,
        email: response.data.email || '',
        address: response.data.address || '',
        gstin: response.data.gstin || '',
        city: response.data.city || '',
        state: response.data.state || ''
      });

      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        city: '',
        state: '',
        pincode: ''
      });
      setShowNewCustomerForm(false);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create customer';
      setError(`Error: ${errorMsg}`);
    }
  };

  // ✅ Select existing customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerInfo({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      city: customer.city || '',
      state: customer.state || ''
    });
    setCustomerSearchTerm('');
  };

  // Load on mount
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('shopCart', JSON.stringify(cart));
  }, [cart]);

  // Handle custom price change - real-time calculation
  const handlePriceChange = (productId, price) => {
    if (price === '' || price === null) {
      const newPrices = { ...customPrices };
      delete newPrices[productId];
      setCustomPrices(newPrices);
    } else {
      setCustomPrices({
        ...customPrices,
        [productId]: parseFloat(price) || 0
      });
    }
  };

  // Get actual price (custom or standard)
  const getActualPrice = (product) => {
    if (customPrices[product.id]) {
      return customPrices[product.id];
    }
    return product.sellingPrice || 0;
  };

  // Calculate savings for display
  const calculateSavings = (product) => {
    const standardPrice = product.sellingPrice || 0;
    const actualPrice = getActualPrice(product);
    const saving = standardPrice - actualPrice;
    const savingPercent = standardPrice > 0 ? ((saving / standardPrice) * 100).toFixed(0) : 0;
    return { saving, savingPercent };
  };

  // Handle add to cart
  const handleAddToCart = (product, quantity) => {
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const productStock = product.quantity || 0;
    const productName = product.productName || product.name || 'Product';
    const actualPrice = getActualPrice(product);
    const standardPrice = product.sellingPrice || 0;
    const productGst = product.gstRate || 18;
    const productCost = product.costPrice || 0;
    const productSku = product.sku || 'N/A';
    const productDesc = product.description || '';

    if (quantity > productStock) {
      setError(`⚠️ Only ${productStock} items available!`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + parseInt(quantity);
      if (newQuantity > productStock) {
        setError(`⚠️ Only ${productStock} items available!`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: productName,
        sellingPrice: actualPrice,
        standardPrice: standardPrice,
        gstRate: productGst,
        quantity: parseInt(quantity),
        costPrice: productCost,
        description: productDesc,
        sku: productSku
      }]);
    }

    setSuccess(`✅ ${productName} added to cart!`);
    setQuantityInput({ ...quantityInput, [product.id]: '' });
    // Clear custom price for this product after adding
    const newPrices = { ...customPrices };
    delete newPrices[product.id];
    setCustomPrices(newPrices);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Update cart quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      setError(`⚠️ Only ${product.quantity} items available!`);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remove from cart
  const handleRemoveFromCart = (productId) => {
    const item = cart.find(i => i.productId === productId);
    setCart(cart.filter(item => item.productId !== productId));
    setSuccess(`🗑️ ${item?.productName} removed from cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Clear cart
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the entire cart?')) {
      setCart([]);
      setSuccess('Cart cleared!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalSavings = 0;

    cart.forEach(item => {
      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemStandardSubtotal = item.quantity * item.standardPrice;
      const itemTax = (itemSubtotal * item.gstRate) / 100;
      
      subtotal += itemSubtotal;
      totalTax += itemTax;
      totalSavings += itemStandardSubtotal - itemSubtotal;
    });

    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax,
      savings: totalSavings
    };
  };

  // ✅ Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  );

  // Create sales order
  const handleCreateSalesOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerInfo.name || !customerInfo.phone) {
      setError('Please select or create a customer with name and phone');
      return;
    }

    if (cart.length === 0) {
      setError('Cart is empty! Add products first.');
      return;
    }

    try {
      setCreatingOrder(true);

      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress: customerInfo.address,
        customerGstIn: customerInfo.gstin,
        customerState: customerInfo.state,

        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          gstRate: item.gstRate
        }))
      };

      console.log('📝 Creating sales order:', orderData);

      const response = await axiosInstance.post('/api/sales-orders', orderData);
      console.log('✅ Sales order created:', response.data);

      const orderId = response.data.id || response.data.salesOrderId;
      setCreatedOrderId(orderId);

      setSuccess('✅ Sales order created successfully! Opening invoice...');

      // Reset everything
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '', address: '', gstin: '', city: '', state: '' });
      setSelectedCustomerId(null);
      setCustomPrices({});
      setShowCartModal(false);
      localStorage.removeItem('shopCart');

      // Show invoice after 1 second
      setTimeout(() => {
        setShowInvoice(true);
      }, 1000);
    } catch (err) {
      console.error('❌ Error creating order:', err);
      const errorMsg = err.response?.data?.error || 'Failed to create sales order';
      setError(errorMsg);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    const productName = product.productName || product.name || '';
    const sku = product.sku || '';
    
    return (
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-modern-container">
      {/* Header */}
      <div className="shop-modern-header">
        <div className="header-content">
          <h1 className="shop-title">🛒 Product Shop</h1>
          <p className="shop-subtitle">Set custom prices for each product</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowCartModal(true)}
            className="cart-button"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-count">{cart.length}</span>
            <span className="cart-text">View Cart</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Search Bar */}
      <div className="search-container-modern">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-modern"
          />
          <span className="search-count">{filteredProducts.length} products</span>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state-modern">
          <div className="empty-icon">📦</div>
          <p className="empty-text">No products found</p>
          <p className="empty-subtext">Try searching for something else</p>
        </div>
      ) : (
        <div className="products-grid-modern">
          {filteredProducts.map((product) => {
            const productName = product.productName || product.name || 'Unknown Product';
            const productSku = product.sku || 'N/A';
            const productDesc = product.description || 'No description';
            const standardPrice = product.sellingPrice || 0;
            const productGst = product.gstRate || 18;
            const productStock = product.quantity || 0;
            const actualPrice = getActualPrice(product);
            const { saving, savingPercent } = calculateSavings(product);

            return (
              <div key={product.id} className="product-card-final">
                {/* Stock Badge - Top Right */}
                <div className="stock-badge-top">
                  <span className={`stock-badge ${productStock > 10 ? 'in-stock' : productStock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                    {productStock > 10 ? '✓ In Stock' : productStock > 0 ? '⚠ Low Stock' : '❌ Out'}
                  </span>
                </div>

                {/* SKU Badge - Top Left */}
                <div className="sku-badge-top">
                  <span className="sku-tag">{productSku}</span>
                </div>

                {/* Product Name */}
                <h3 className="product-name-final">{productName}</h3>
                
                {/* Description */}
                <p className="product-description-final">{productDesc}</p>

                {/* Stock Remaining */}
                <div className="stock-remaining-final">
                  <span className="stock-label">Stock:</span>
                  <span className={`stock-count-final ${productStock > 10 ? 'plenty' : productStock > 0 ? 'low' : 'none'}`}>
                    {productStock} pcs
                  </span>
                </div>

                {/* Price Section with Custom Price Input */}
                <div className="price-section-final">
                  <div className="price-row-final">
                    <span className="price-label-final">Standard Price:</span>
                    <span className="standard-price-final">₹{standardPrice.toFixed(0)}</span>
                  </div>

                  <div className="custom-price-wrapper">
                    <label className="custom-price-label-final">Set Your Price:</label>
                    <div className="price-input-container">
                      <span className="rupee-symbol">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        placeholder="Enter price"
                        value={customPrices[product.id] || ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="custom-price-input-final"
                      />
                    </div>
                  </div>

                  {saving !== 0 && (
                    <div className={`savings-badge-final ${saving > 0 ? 'discount' : 'premium'}`}>
                      <span className="savings-label">
                        {saving > 0 ? '💰 Save' : '📈 Extra'}
                      </span>
                      <span className="savings-amount-final">₹{Math.abs(saving).toFixed(0)}</span>
                      <span className="savings-percent-final">{savingPercent}%</span>
                    </div>
                  )}

                  <div className="final-price-display">
                    <span className="final-price-label">Your Price:</span>
                    <span className="final-price-value">₹{actualPrice.toFixed(0)}</span>
                  </div>
                </div>

                {/* Action Section */}
                <div className="action-section-final">
                  <div className="quantity-section-final">
                    <label className="qty-label-final">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max={productStock}
                      value={quantityInput[product.id] || ''}
                      onChange={(e) => setQuantityInput({
                        ...quantityInput,
                        [product.id]: e.target.value
                      })}
                      placeholder="0"
                      className="qty-input-final"
                      disabled={productStock === 0}
                    />
                  </div>
                  <button
                    onClick={() => handleAddToCart(product, quantityInput[product.id] || 1)}
                    className={`btn-add-cart-final ${productStock === 0 ? 'disabled' : ''}`}
                    disabled={productStock === 0}
                  >
                    {productStock === 0 ? '❌ Out of Stock' : '➕ Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="modal-overlay-modern" onClick={() => setShowCartModal(false)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>🛒 Shopping Cart</h3>
              <button 
                onClick={() => setShowCartModal(false)}
                className="close-btn-modern"
              >
                ✕
              </button>
            </div>

            <div className="modal-body-modern">
              {/* ✅ CUSTOMER SELECTION / CREATION */}
              <div className="customer-section">
                <h4>👥 Customer Information</h4>

                {/* ✅ EXISTING CUSTOMERS */}
                {!showNewCustomerForm && (
                  <div className="customer-selection">
                    <div className="search-customers-container">
                      <input
                        type="text"
                        placeholder="🔍 Search existing customers..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="search-customer-input"
                      />
                    </div>

                    {customerSearchTerm && (
                      <div className="customer-list">
                        {customerLoading ? (
                          <p className="loading-customers">Loading customers...</p>
                        ) : filteredCustomers.length > 0 ? (
                          <>
                            {filteredCustomers.map(customer => (
                              <div
                                key={customer.id}
                                className={`customer-item ${selectedCustomerId === customer.id ? 'selected' : ''}`}
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className="customer-item-header">
                                  <strong>{customer.name}</strong>
                                  {selectedCustomerId === customer.id && <span className="checkmark">✓</span>}
                                </div>
                                <div className="customer-item-details">
                                  <span>📧 {customer.email}</span>
                                  <span>📱 {customer.phone}</span>
                                  {customer.city && <span>🏙️ {customer.city}</span>}
                                  {customer.gstin && <span>🔢 {customer.gstin}</span>}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className="no-customers-found">No customers found</p>
                        )}
                      </div>
                    )}

                    <button
                      className="btn-add-new-customer"
                      onClick={() => setShowNewCustomerForm(true)}
                    >
                      ➕ Add New Customer
                    </button>
                  </div>
                )}

                {/* ✅ NEW CUSTOMER FORM */}
                {showNewCustomerForm && (
                  <form className="new-customer-form" onSubmit={handleCreateNewCustomer}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone *</label>
                        <input
                          type="tel"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="9876543210"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={newCustomer.city}
                          onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                          placeholder="City"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>GSTIN/UIN</label>
                        <input
                          type="text"
                          value={newCustomer.gstin}
                          onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                          placeholder="27ABCDE1234F1Z5"
                          maxLength="15"
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          value={newCustomer.state}
                          onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        placeholder="Street address"
                        rows="2"
                      />
                    </div>

                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        value={newCustomer.pincode}
                        onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                        placeholder="413102"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-create-customer">
                        ✅ Create Customer
                      </button>
                      <button
                        type="button"
                        className="btn-cancel-customer"
                        onClick={() => setShowNewCustomerForm(false)}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* ✅ SELECTED CUSTOMER DISPLAY */}
                {selectedCustomerId && !showNewCustomerForm && (
                  <div className="selected-customer-display">
                    <h3>📋 Selected Customer</h3>
                    <div className="customer-display-box">
                      <p><strong>{customerInfo.name}</strong></p>
                      <p>📧 {customerInfo.email}</p>
                      <p>📱 {customerInfo.phone}</p>
                      {customerInfo.address && <p>📍 {customerInfo.address}</p>}
                      {customerInfo.city && <p>🏙️ {customerInfo.city}</p>}
                      {customerInfo.gstin && <p>🔢 {customerInfo.gstin}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="cart-items-section">
                <h4>Items ({cart.length})</h4>
                {cart.length === 0 ? (
                  <p className="empty-cart-message">Your cart is empty</p>
                ) : (
                  <div className="cart-items-list">
                    {cart.map((item) => (
                      <div key={item.productId} className="cart-item-modern">
                        <div className="item-info">
                          <h5>{item.productName}</h5>
                          <p className="item-price">₹{item.sellingPrice.toFixed(0)} × {item.quantity}</p>
                          {item.standardPrice > item.sellingPrice && (
                            <p className="item-savings">💰 Save: ₹{((item.standardPrice - item.sellingPrice) * item.quantity).toFixed(0)}</p>
                          )}
                        </div>
                        <div className="item-controls">
                          <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>−</button>
                          <span className="qty-display">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>+</button>
                          <span className="item-total">₹{(item.quantity * item.sellingPrice).toFixed(0)}</span>
                          <button 
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="btn-remove-item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Summary & Order Form */}
              {cart.length > 0 && (
                <>
                  {/* Summary */}
                  <div className="order-summary-modern">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>GST (Tax)</span>
                      <span>₹{totals.tax.toFixed(0)}</span>
                    </div>
                    {totals.savings > 0 && (
                      <div className="summary-row savings">
                        <span>💰 Total Savings</span>
                        <span>₹{totals.savings.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>Total</span>
                      <span>₹{totals.total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Order Form */}
                  <form onSubmit={handleCreateSalesOrder} className="customer-form-modern">
                    <div className="form-actions-modern">
                      <button 
                        type="submit"
                        className="btn-create-order"
                        disabled={creatingOrder || !selectedCustomerId}
                      >
                        {creatingOrder ? 'Creating...' : '📋 Create Order'}
                      </button>
                      <button 
                        type="button"
                        onClick={handleClearCart}
                        className="btn-clear-cart"
                      >
                        🗑️ Clear
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoice && createdOrderId && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-container">
            <button 
              className="invoice-close-btn"
              onClick={() => setShowInvoice(false)}
            >
              ✕
            </button>
            <InvoiceGenerator 
              orderId={createdOrderId}
              onClose={() => setShowInvoice(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;