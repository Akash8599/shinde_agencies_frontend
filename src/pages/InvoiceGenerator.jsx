import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './InvoiceGenerator.css';

const InvoiceGenerator = ({ orderId, onClose }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invoiceRef = useRef();

  useEffect(() => {
    if (orderId) {
      fetchInvoiceData();
    }
  }, [orderId]);

  // Fetch invoice data from backend
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/invoices/${orderId}`);
      console.log('✅ Invoice data fetched:', response.data);
      setInvoiceData(response.data);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        
        windowWidth: 1200, // ✅ Force desktop width
        width: 1200,       // ✅ Force capture width
        x: 0,
        y: 0,
        scrollY: -window.scrollY // ✅ Handle scroll position
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);

      console.log('✅ PDF downloaded successfully');
    } catch (err) {
      console.error('❌ Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    const element = invoiceRef.current;
    const newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>Invoice</title>');
    newWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .invoice-container { max-width: 900px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
      </style>
    `);
    newWindow.document.write('</head><body>');
    newWindow.document.write(element.innerHTML);
    newWindow.document.write('</body></html>');
    newWindow.document.close();
  };

  if (loading) {
    return <div className="invoice-loading">Loading invoice...</div>;
  }

  if (error) {
    return (
      <div className="invoice-error">
        <p>{error}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  if (!invoiceData) {
    return <div className="invoice-error">No invoice data</div>;
  }

  // Calculate item totals
  const calculateItemTotal = (item) => {
    const qty = item.quantity || 0;
    const rate = item.sellingPrice || 0;
    const subtotal = qty * rate;
    const gstRate = item.gstRate || 0;
    const tax = (subtotal * gstRate) / 100;
    return { subtotal, tax, total: subtotal + tax };
  };

  // GST breakdown (IGST for now, can be CGST/SGST for intra-state)
  const calculateGSTBreakdown = () => {
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    invoiceData.items?.forEach(item => {
      const { tax } = calculateItemTotal(item);
      igst += tax;
    });

    return { cgst, sgst, igst };
  };

  const gstBreakdown = calculateGSTBreakdown();
  const subtotal = invoiceData.subtotal || 0;
  const totalTax = invoiceData.totalTax || 0;
  const totalAmount = invoiceData.totalAmount || 0;

  return (
    <div className="invoice-modal">
      <div className="invoice-modal-content">
        {/* ✅ Action Buttons - hidden on print via no-print class */}
        <div className="invoice-actions no-print">
          <button className="btn btn-download" onClick={handleDownloadPDF} title="Download PDF">
            📥 Download PDF
          </button>
          <button className="btn btn-print" onClick={handlePrint} title="Print">
            🖨️ Print
          </button>
          <button className="btn btn-view" onClick={handleOpenInNewTab} title="Open in New Tab">
            🔗 Open in New Tab
          </button>
          <button className="btn btn-close" onClick={onClose} title="Close">
            ✕ Close
          </button>
        </div>

        {/* ✅ Invoice Content - print optimized */}
        <div ref={invoiceRef} className="invoice-content">
          {/* ✅ COMPACT Header - logo inline with company name */}
          <div className="invoice-header">
            <div className="header-left">
              <div className="company-info-inline">
                {invoiceData.logo && (
                  <img src={invoiceData.logo} alt="Logo" className="company-logo" />
                )}
                <div className="company-text">
                  <h1>{invoiceData.companyName}</h1>
                  <p className="company-address">
                    {invoiceData.address}
                    {invoiceData.city && `, ${invoiceData.city}`}
                    {invoiceData.state && `, ${invoiceData.state}`}
                    {invoiceData.postalCode && ` - ${invoiceData.postalCode}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="header-right">
              <h2>GST INVOICE</h2>
              <p><strong>Invoice No.:</strong> {invoiceData.invoiceNumber}</p>
              <p><strong>Dated:</strong> {invoiceData.invoiceDate}</p>
              <p><strong>Order No.:</strong> {invoiceData.orderNumber}</p>
            </div>
          </div>

          {/* ✅ COMPACT Seller & Buyer Section with GSTIN & State Code */}
          <div className="seller-buyer-section">
            {/* ✅ SOLD BY - Compact with GSTIN & State Code */}
            <div className="seller-section">
              <h4>SOLD BY</h4>
              <div className="seller-details">
                <p className="entity-name"><strong>{invoiceData.companyName}</strong></p>
                <p>{invoiceData.address}</p>
                {invoiceData.city && <p>{invoiceData.city}, {invoiceData.state} - {invoiceData.postalCode}</p>}

                {/* ✅ ADDED: GSTIN/UIN and State Code in compact inline layout */}
                <div className="gst-info-row">
                  <div className="gst-item">
                    <span className="gst-label">GSTIN/UIN:</span>
                    <span className="gst-value">{invoiceData.gstin || 'N/A'}</span>
                  </div>
                  {invoiceData.stateCode && (
                    <div className="gst-item">
                      <span className="gst-label">State Code:</span>
                      <span className="gst-value">{invoiceData.stateCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ BILL TO - Compact with GSTIN & State Code */}
            <div className="buyer-section">
              <h4>BILL TO (BUYER)</h4>
              <div className="buyer-details">
                <p className="entity-name"><strong>{invoiceData.customerName}</strong></p>
                <p>{invoiceData.customerAddress}</p>
                {invoiceData.customerCity && <p>{invoiceData.customerCity}, {invoiceData.customerState} - {invoiceData.customerPostalCode}</p>}

                {/* ✅ ADDED: Buyer GSTIN/UIN and State Code */}
                <div className="gst-info-row">
                  {invoiceData.customerGstIn && (
                    <div className="gst-item">
                      <span className="gst-label">GSTIN/UIN:</span>
                      <span className="gst-value">{invoiceData.customerGstIn}</span>
                    </div>
                  )}
                  {invoiceData.customerStateCode && (
                    <div className="gst-item">
                      <span className="gst-label">State Code:</span>
                      <span className="gst-value">{invoiceData.customerStateCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ COMPACT Items Table - white headers, print-optimized */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Sl</th>
                  <th className="desc-column">Description of Goods</th>
                  <th>HSN/SAC</th>
                  <th className="qty-column">Qty</th>
                  <th className="rate-column">Rate (incl Tax)</th>
                  <th className="rate-column">Rate (excl Tax)</th>
                  <th>Per</th>
                  <th className="amount-column">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items?.map((item, index) => {
                  const { subtotal, tax, total } = calculateItemTotal(item);
                  const rateExclTax = item.sellingPrice / (1 + (item.gstRate || 0) / 100);
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="desc-column">{item.productName}</td>
                      <td>7318</td>
                      <td className="qty-column">{item.quantity}</td>
                      <td className="rate-column">₹{item.sellingPrice?.toFixed(2)}</td>
                      <td className="rate-column">₹{rateExclTax.toFixed(2)}</td>
                      <td>Pcs</td>
                      <td className="amount-column">₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ COMPACT Totals Section */}
          <div className="totals-section">
            <div className="totals-left">
              <p className="totals-label">Amount Chargeable (in words)</p>
              <p className="amount-words">
                INR {numberToWords(Math.round(totalAmount))} Only
              </p>
            </div>

            <div className="totals-right">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td><strong>Taxable Value</strong></td>
                    <td className="amount-cell">₹{subtotal.toFixed(2)}</td>
                  </tr>
                  {gstBreakdown.cgst > 0 && (
                    <tr>
                      <td>CGST (9%)</td>
                      <td className="amount-cell">₹{(gstBreakdown.cgst / 2).toFixed(2)}</td>
                    </tr>
                  )}
                  {gstBreakdown.sgst > 0 && (
                    <tr>
                      <td>SGST (9%)</td>
                      <td className="amount-cell">₹{(gstBreakdown.sgst / 2).toFixed(2)}</td>
                    </tr>
                  )}
                  {gstBreakdown.igst > 0 && (
                    <tr>
                      <td>IGST ({invoiceData.items?.[0]?.gstRate || 0}%)</td>
                      <td className="amount-cell">₹{gstBreakdown.igst.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td className="amount-cell"><strong>₹{totalAmount.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ COMPACT Bank Details */}
          {invoiceData.bankName && (
            <div className="bank-details">
              <h4>COMPANY'S BANK DETAILS</h4>
              <div className="bank-details-grid">
                <div className="bank-item">
                  <span className="bank-label">Bank Name:</span>
                  <span className="bank-value">{invoiceData.bankName}</span>
                </div>
                <div className="bank-item">
                  <span className="bank-label">A/c Holder:</span>
                  <span className="bank-value">{invoiceData.accountHolderName}</span>
                </div>
                <div className="bank-item">
                  <span className="bank-label">A/c Number:</span>
                  <span className="bank-value">{invoiceData.accountNumber}</span>
                </div>
                <div className="bank-item">
                  <span className="bank-label">IFSC Code:</span>
                  <span className="bank-value">{invoiceData.ifscCode}</span>
                </div>
              </div>
            </div>
          )}

          {/* ✅ COMPACT Declaration Section */}
          <div className="declaration-section">
            <h4>DECLARATION</h4>
            <div className="declaration-content">
              <p>
                We hereby declare that the particulars mentioned hereinabove are true and correct and that the goods mentioned above have been supplied in accordance to the order number and details mentioned above. We further certify that this invoice is issued in accordance with the provisions of the Goods and Services Tax Act, 2017.
              </p>
              <p className="declaration-note">
                <strong>Note:</strong> This is a computer-generated invoice. No signature is required.
              </p>
            </div>
          </div>

          {/* ✅ COMPACT Signature Section - NO "MR.Shinde" */}
          <div className="signature-seal-section">
            <div className="seller-signature-box">
              <div className="sig-box">
                {invoiceData.signature && (
                  <img src={invoiceData.signature} alt="Signature" className="signature-image" />
                )}
                <p className="sig-company-name">For {invoiceData.companyName}</p>
                <div className="sig-line"></div>
                <p className="sig-label">Authorized Signatory</p>
              </div>
              {invoiceData.authorizedSignatory && (
                <div className="signatory-info">
                  <p className="signatory-name">{invoiceData.authorizedSignatory}</p>
                  <p className="signatory-designation">{invoiceData.authorizedSignatoryDesignation}</p>
                </div>
              )}
            </div>

            {/* Customer Seal & Signature */}
            <div className="customer-signature-box">
              <div className="sig-box customer-sig">
                {invoiceData.customerSeal && (
                  <img src={invoiceData.customerSeal} alt="Customer Seal" className="customer-seal-image" />
                )}
                {invoiceData.customerSignature && (
                  <img src={invoiceData.customerSignature} alt="Customer Signature" className="signature-image" />
                )}
                <div className="sig-line"></div>
                <p className="sig-label">Customer Seal & Signature</p>
              </div>
              {invoiceData.customerRepName && (
                <div className="signatory-info">
                  <p className="signatory-name">{invoiceData.customerRepName}</p>
                  <p className="signatory-designation">Authorized Representative</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Footer - NO "MR.Shinde" - removed completely */}
          <div className="invoice-footer">
            <p><strong>SUBJECT TO {invoiceData.jurisdiction || 'BARAMATI'} JURISDICTION</strong></p>
            <p>This is a Computer Generated Invoice</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      if (n % 10 !== 0) {
        result += ' ' + ones[n % 10];
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }
    return result.trim();
  };

  if (num === 0) return 'Zero';

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  if (crore > 0) result += convertHundreds(crore) + ' Crore ';

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) result += convertHundreds(lakh) + ' Lakh ';

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) result += convertHundreds(thousand) + ' Thousand ';

  if (num > 0) result += convertHundreds(num);

  return result.trim();
};

export default InvoiceGenerator;