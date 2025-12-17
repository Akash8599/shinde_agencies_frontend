import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import API_CONFIG from '../config/Api';
import './ProductShop.css';

const ProductShop = () => {
  const [currentView, setCurrentView] = useState('products'); // products, cart, checkout
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // ✅ CUSTOMER MANAGEMENT
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  

  // Customer info for checkout
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    city: '',
    state: ''
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
    pincode: ''
  });

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.PRODUCTS);
      setProducts(response.data);
      console.log('✅ Products loaded:', response.data.length, 'items');
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
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.CUSTOMERS);
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
      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.CREATE_CUSTOMER, newCustomer);
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

  // Load products and customers on component mount
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopCart', JSON.stringify(cart));
  }, [cart]);

  // Add product to cart
  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sellingPrice: product.sellingPrice,
        gstRate: product.gstRate,
        quantity: 1,
        costPrice: product.costPrice,
        description: product.description
      }]);
    }
    setSuccess(`✅ ${product.name} added to cart!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Update cart item quantity
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

  // Remove item from cart
  const handleRemoveFromCart = (productId) => {
    const item = cart.find(i => i.productId === productId);
    setCart(cart.filter(item => item.productId !== productId));
    setSuccess(`🗑️ ${item?.productName} removed from cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Clear entire cart
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      setSuccess('Cart cleared!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Calculate cart totals
  const calculateCartTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    cart.forEach(item => {
      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemTax = (itemSubtotal * item.gstRate) / 100;
      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax
    };
  };

  // Checkout - Create order
  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!customerInfo.name || !customerInfo.phone) {
      setError('Please select or create a customer with name and phone');
      return;
    }

    if (cart.length === 0) {
      setError('Cart is empty!');
      return;
    }

    // Validate email format
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);

      // Prepare order data
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress: customerInfo.address,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice
        }))
      };

      console.log('📤 Creating order:', orderData);

      // Create order
      const response = await axiosInstance.post(
        API_CONFIG.ENDPOINTS.CREATE_SALES_ORDER,
        orderData
      );

      console.log('✅ Order created:', response.data);

      setSuccess(`
🎉 Order Created Successfully!

Order Number: ${response.data.orderNumber}
Total Amount: ₹${response.data.totalAmount?.toFixed(2) || calculateCartTotals().total.toFixed(2)}

Your order has been placed and invoice is ready.
      `);

      // Clear cart and reset form
      setCart([]);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        city: '',
        state: ''
      });
      setSelectedCustomerId(null);
      localStorage.removeItem('shopCart');

      // REFRESH products to get updated inventory immediately
      fetchProducts();

      // Go back to products view after 3 seconds
      setTimeout(() => {
        setCurrentView('products');
        setSuccess('');
      }, 3000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create order';
      console.error('❌ Error creating order:', err);

      if (err.response?.status === 403) {
        setError('🔒 Access Denied: You do not have permission to create orders');
      } else if (err.response?.status === 400) {
        setError(`⚠️ Invalid request: ${errorMsg}`);
      } else {
        setError(`❌ Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ✅ Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  );

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category || 'Uncategorized'))];

  const totals = calculateCartTotals();

  return (
    <div className="product-shop">
      {/* Header */}
      <div className="shop-header">
        <h1>🛒 Product Shop</h1>
        <div className="cart-icon" onClick={() => setCurrentView('cart')}>
          <span className="cart-badge">{cart.length}</span>
          🛒 Cart ({cart.length})
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success" style={{ whiteSpace: 'pre-wrap' }}>{success}</div>}

      {/* Products View */}
      {currentView === 'products' && (
        <div className="products-view">
          {/* Search and Filter */}
          <div className="search-filter-container">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    {product.quantity <= 5 && product.quantity > 0 && (
                      <span className="low-stock">⚠️ Low Stock</span>
                    )}
                    {product.quantity === 0 && (
                      <span className="out-of-stock">❌ Out of Stock</span>
                    )}
                  </div>

                  <p className="product-description">{product.description}</p>

                  <div className="product-info">
                    <div className="price-info">
                      <span className="label">Price:</span>
                      <span className="price">₹{product.sellingPrice}</span>
                    </div>
                    <div className="gst-info">
                      <span className="label">GST:</span>
                      <span className="gst">{product.gstRate}%</span>
                    </div>
                    <div className="stock-info">
                      <span className="label">Stock:</span>
                      <span className={product.quantity > 0 ? 'in-stock' : 'out-of-stock'}>
                        {product.quantity} available
                      </span>
                    </div>
                  </div>

                  <button
                    className={`btn-add-to-cart ${product.quantity === 0 ? 'disabled' : ''}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.quantity === 0}
                  >
                    {product.quantity === 0 ? '❌ Out of Stock' : '➕ Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart View */}
      {currentView === 'cart' && (
        <div className="cart-view">
          <button className="btn-back" onClick={() => setCurrentView('products')}>
            ← Back to Products
          </button>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <h2>Your cart is empty</h2>
              <button className="btn-primary" onClick={() => setCurrentView('products')}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-content">
              {/* Cart Items */}
              <div className="cart-items">
                <h2>Cart Items ({cart.length})</h2>
                <div className="items-list">
                  {cart.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const itemTotal = item.quantity * item.sellingPrice;
                    const itemTax = (itemTotal * item.gstRate) / 100;

                    return (
                      <div key={item.productId} className="cart-item">
                        <div className="item-details">
                          <h4>{item.productName}</h4>
                          <p className="item-price">₹{item.sellingPrice} × {item.quantity} = ₹{itemTotal.toFixed(2)}</p>
                          <p className="item-gst">GST ({item.gstRate}%): ₹{itemTax.toFixed(2)}</p>
                        </div>

                        <div className="item-controls">
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product?.quantity || 999}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="qty-input"
                          />
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            title="Remove from cart"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="item-total">
                          ₹{(itemTotal + itemTax).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cart Summary and Checkout */}
              <div className="cart-summary">
                <div className="summary-box">
                  <div className="summary-item">
                    <span>Subtotal:</span>
                    <strong>₹{totals.subtotal.toFixed(2)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>GST Tax:</span>
                    <strong>₹{totals.tax.toFixed(2)}</strong>
                  </div>
                  <div className="summary-item total">
                    <span>Total:</span>
                    <strong>₹{totals.total.toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  className="btn-checkout"
                  onClick={() => setCurrentView('checkout')}
                >
                  🛍️ Proceed to Checkout
                </button>

                <button
                  className="btn-continue-shopping"
                  onClick={() => setCurrentView('products')}
                >
                  ← Continue Shopping
                </button>

                <button
                  className="btn-clear-cart"
                  onClick={handleClearCart}
                >
                  🗑️ Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkout View */}
      {currentView === 'checkout' && (
        <div className="checkout-view">
          <button className="btn-back" onClick={() => setCurrentView('cart')}>
            ← Back to Cart
          </button>

          <div className="checkout-content">
            {/* ✅ CUSTOMER SELECTION / CREATION */}
            <div className="customer-section">
              <h2>👥 Customer Information</h2>

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

            {/* Order Summary */}
            <div className="order-summary-section">
              <h2>Order Summary</h2>
              <div className="order-items-review">
                {cart.map(item => (
                  <div key={item.productId} className="review-item">
                    <div className="review-item-info">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-qty">× {item.quantity}</span>
                    </div>
                    <span className="item-amount">₹{(item.quantity * item.sellingPrice * (1 + item.gstRate / 100)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-summary-box">
                <div className="summary-item">
                  <span>Subtotal:</span>
                  <strong>₹{totals.subtotal.toFixed(2)}</strong>
                </div>
                <div className="summary-item">
                  <span>GST Tax:</span>
                  <strong>₹{totals.tax.toFixed(2)}</strong>
                </div>
                <div className="summary-item total">
                  <span>TOTAL:</span>
                  <strong>₹{totals.total.toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn-place-order"
                onClick={handleCheckout}
                disabled={loading || !selectedCustomerId}
              >
                {loading ? 'Creating Order...' : '✅ Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductShop;