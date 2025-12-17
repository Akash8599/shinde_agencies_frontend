import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './CompanySettings.css';

const CompanySettings = ({ onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    gstin: '',
    uin: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    stateCode: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    authorizedSignatory: '',
    authorizedSignatoryDesignation: '',
    logo: null,
    signature: null,
    logoPreview: null,
    signaturePreview: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing company settings
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/company-settings');
      console.log('✅ Company settings fetched:', response.data);
      
      setFormData({
        ...response.data,
        logo: null,
        signature: null,
        logoPreview: response.data.logo,
        signaturePreview: response.data.signature
      });
      setError('');
    } catch (err) {
      console.error('Error fetching company settings:', err);
      // No settings yet, that's okay
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logo: reader.result,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature file selection
  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          signature: reader.result,
          signaturePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
      logoPreview: null
    }));
  };

  // Remove signature
  const handleRemoveSignature = () => {
    setFormData(prev => ({
      ...prev,
      signature: null,
      signaturePreview: null
    }));
  };

  // Save company settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.companyName.trim()) {
        setError('Company name is required');
        return;
      }
      if (!formData.gstin.trim()) {
        setError('GSTIN is required');
        return;
      }
      if (!formData.address.trim()) {
        setError('Address is required');
        return;
      }

      setSaving(true);
      setError('');

      // Prepare data for API
      const dataToSend = {
        companyName: formData.companyName,
        gstin: formData.gstin,
        uin: formData.uin || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        stateCode: formData.stateCode,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        website: formData.website,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        accountHolderName: formData.accountHolderName,
        authorizedSignatory: formData.authorizedSignatory,
        authorizedSignatoryDesignation: formData.authorizedSignatoryDesignation,
        logo: formData.logo,
        signature: formData.signature
      };

      console.log('📤 Saving company settings...');

      const response = await axiosInstance.put('/api/company-settings', dataToSend);
      
      console.log('✅ Company settings saved:', response.data);
      setSuccess('✅ Company settings saved successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Error saving company settings:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save settings';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading company settings...</div>;
  }

  return (
    <div className="company-settings-container">
      <div className="settings-header">
        <div className="header-top">
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} className="btn-back">
              ← Back to Dashboard
            </button>
          )}
          <h2>⚙️ Company Settings</h2>
        </div>
        <p>Manage your company details for invoices and reports</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSaveSettings} className="settings-form">
        
        {/* Company Information Section */}
        <div className="form-section">
          <h3>📋 Company Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g., Shinde Agencies"
                required
              />
            </div>
            <div className="form-group">
              <label>GSTIN *</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="e.g., 27CNWPS7399F1ZS"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>UIN (if applicable)</label>
              <input
                type="text"
                name="uin"
                value={formData.uin}
                onChange={handleInputChange}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>State Code</label>
              <input
                type="text"
                name="stateCode"
                value={formData.stateCode}
                onChange={handleInputChange}
                placeholder="e.g., 27"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full business address"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Baramati"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="e.g., Maharashtra"
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="e.g., 413102"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-section">
          <h3>📞 Contact Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="e.g., 9922890987"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="e.g., owner@company.com"
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="e.g., www.company.com"
              />
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="form-section">
          <h3>🏦 Bank Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="e.g., Axis Bank Ltd"
              />
            </div>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Name on bank account"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="e.g., 924029012704274"
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="e.g., AXIS0001234"
              />
            </div>
          </div>
        </div>

        {/* Signature & Authorization Section */}
        <div className="form-section">
          <h3>✍️ Authorization Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Authorized Signatory Name</label>
              <input
                type="text"
                name="authorizedSignatory"
                value={formData.authorizedSignatory}
                onChange={handleInputChange}
                placeholder="e.g., Mr. Shinde"
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input
                type="text"
                name="authorizedSignatoryDesignation"
                value={formData.authorizedSignatoryDesignation}
                onChange={handleInputChange}
                placeholder="e.g., Director"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="form-section">
          <h3>🏢 Company Logo</h3>
          
          <div className="file-upload-group">
            <label>Upload Company Logo</label>
            <p className="help-text">
              Recommended size: 150x150px or smaller. Formats: JPG, PNG, GIF
            </p>
            
            {formData.logoPreview && (
              <div className="image-preview">
                <img src={formData.logoPreview} alt="Company Logo Preview" />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="btn-remove"
                >
                  Remove Logo
                </button>
              </div>
            )}
            
            {!formData.logoPreview && (
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="file-input"
              />
            )}
          </div>
        </div>

        {/* Signature Upload Section */}
        <div className="form-section">
          <h3>✍️ Authorized Signature</h3>
          
          <div className="file-upload-group">
            <label>Upload Signature Image</label>
            <p className="help-text">
              Recommended size: 200x100px or smaller. Formats: JPG, PNG, GIF
            </p>
            
            {formData.signaturePreview && (
              <div className="image-preview">
                <img src={formData.signaturePreview} alt="Signature Preview" />
                <button
                  type="button"
                  onClick={handleRemoveSignature}
                  className="btn-remove"
                >
                  Remove Signature
                </button>
              </div>
            )}
            
            {!formData.signaturePreview && (
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureChange}
                className="file-input"
              />
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="info-box">
        <h4>ℹ️ About Company Settings</h4>
        <ul>
          <li>All information entered here will appear on generated invoices</li>
          <li>Logo and signature will be displayed in the invoice header and footer</li>
          <li>Bank details will be shown on invoices for payment reference</li>
          <li>Changes are saved to the database and apply to all future invoices</li>
          <li>You can update these details anytime</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanySettings;