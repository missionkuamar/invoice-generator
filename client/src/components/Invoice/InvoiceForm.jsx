import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createInvoice, updateInvoice } from '../../store/slices/invoiceSlice';
import { fetchShopProfile } from '../../store/slices/shopSlice';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiPrinter, FiDownload, FiAlertCircle } from 'react-icons/fi';

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile: shop } = useSelector((state) => state.shop);
  const { invoices } = useSelector((state) => state.invoices);
  const editInvoice = id ? invoices.find(i => i._id === id) : null;
  
  const [formData, setFormData] = useState({
    customer: { 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      gstNumber: '' 
    },
    items: [{ 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      gstRate: 18,
      amount: 0 
    }],
    discountType: 'none',
    discountValue: 0,
    shippingCharge: 0,
    taxType: 'CGST/SGST',
    notes: '',
    terms: '',
    dueDate: '',
    status: 'draft',
    invoiceImage: null,
  });
  
  const [calculation, setCalculation] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGst: 0,
    grandTotal: 0,
  });
  
  useEffect(() => {
    dispatch(fetchShopProfile());
    if (editInvoice) {
      setFormData({
        customer: editInvoice.customer,
        items: editInvoice.items,
        discountType: editInvoice.discount?.type || 'none',
        discountValue: editInvoice.discount?.value || 0,
        shippingCharge: editInvoice.shippingCharge || 0,
        taxType: editInvoice.taxType || 'CGST/SGST',
        notes: editInvoice.notes || '',
        terms: editInvoice.terms || '',
        dueDate: editInvoice.dueDate?.split('T')[0] || '',
        status: editInvoice.status,
        invoiceImage: null,
      });
    }
  }, [dispatch, editInvoice]);
  
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discountType, formData.discountValue, formData.shippingCharge, formData.taxType]);
  
  const calculateTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    formData.items.forEach(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      
      const gstAmount = (amount * (item.gstRate || 0)) / 100;
      if (formData.taxType === 'IGST') {
        igst += gstAmount;
      } else {
        cgst += gstAmount / 2;
        sgst += gstAmount / 2;
      }
    });
    
    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (subtotal * formData.discountValue) / 100;
    } else if (formData.discountType === 'fixed') {
      discountAmount = formData.discountValue;
    }
    
    const taxableAmount = subtotal - discountAmount;
    const totalGst = cgst + sgst + igst;
    const grandTotal = taxableAmount + totalGst + formData.shippingCharge;
    
    setCalculation({
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalGst,
      grandTotal,
    });
  };
  
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, gstRate: 18, amount: 0 }],
    });
  };
  
  const removeItem = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData({ ...formData, items });
  };
  
  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = parseFloat(value) || 0;
    setFormData({ ...formData, items });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const invoiceData = {
      customer: formData.customer,
      items: formData.items.filter(item => item.description && item.quantity > 0),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      shippingCharge: formData.shippingCharge,
      taxType: formData.taxType,
      notes: formData.notes,
      terms: formData.terms,
      dueDate: formData.dueDate || null,
      status: formData.status,
    };
    
    if (formData.invoiceImage instanceof File) {
      invoiceData.invoiceImage = formData.invoiceImage;
    }
    
    try {
      if (editInvoice) {
        await dispatch(updateInvoice({ id: editInvoice._id, data: invoiceData })).unwrap();
        toast.success('Invoice updated successfully');
      } else {
        await dispatch(createInvoice(invoiceData)).unwrap();
        toast.success('Invoice created successfully');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            {shop?.shopLogo && (
              <img src={shop.shopLogo} alt="Shop Logo" className="h-16 w-16 object-contain mb-3 bg-white rounded-lg p-2" />
            )}
            <h2 className="text-2xl font-bold">{shop?.shopName}</h2>
            <p className="text-sm opacity-90">{shop?.address?.street}, {shop?.address?.city}</p>
            <p className="text-sm opacity-90">GST: {shop?.gstNumber || 'Not Registered'}</p>
            <p className="text-sm opacity-90">Email: {shop?.email} | Phone: {shop?.phone}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold">TAX INVOICE</h3>
          </div>
        </div>
      </div>
      
      {/* Customer Details */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              value={formData.customer.name}
              onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.customer.email}
              onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, email: e.target.value } })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={formData.customer.phone}
              onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, phone: e.target.value } })}
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">GST Number (if registered)</label>
            <input
              type="text"
              value={formData.customer.gstNumber}
              onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, gstNumber: e.target.value } })}
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Billing Address</label>
            <textarea
              value={formData.customer.address}
              onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, address: e.target.value } })}
              className="input-field"
              rows="2"
            />
          </div>
        </div>
      </div>
      
      {/* Invoice Items Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Invoice Items</h3>
          <button type="button" onClick={addItem} className="btn-primary text-sm flex items-center gap-2">
            <FiPlus /> Add Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium">Description</th>
                <th className="px-3 py-2 text-left text-sm font-medium">HSN/SAC</th>
                <th className="px-3 py-2 text-center text-sm font-medium">Quantity</th>
                <th className="px-3 py-2 text-right text-sm font-medium">Unit Price (₹)</th>
                <th className="px-3 py-2 text-center text-sm font-medium">GST %</th>
                <th className="px-3 py-2 text-right text-sm font-medium">Amount (₹)</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="input-field text-sm"
                      placeholder="Item description"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.hsn || ''}
                      onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                      className="input-field text-sm w-24"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="input-field text-sm w-20 text-center"
                      min="1"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="input-field text-sm w-28 text-right"
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.gstRate}
                      onChange={(e) => updateItem(index, 'gstRate', e.target.value)}
                      className="input-field text-sm w-20"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    ₹{(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Tax & Charges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Tax Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tax Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="CGST/SGST"
                    checked={formData.taxType === 'CGST/SGST'}
                    onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                    className="mr-2"
                  />
                  CGST + SGST
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="IGST"
                    checked={formData.taxType === 'IGST'}
                    onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                    className="mr-2"
                  />
                  IGST
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Discount</label>
              <div className="flex gap-3">
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discountValue: 0 })}
                  className="input-field w-32"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                {formData.discountType !== 'none' && (
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="input-field w-40"
                    placeholder={formData.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                    min="0"
                    step="0.01"
                  />
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Shipping Charges</label>
              <input
                type="number"
                value={formData.shippingCharge}
                onChange={(e) => setFormData({ ...formData, shippingCharge: parseFloat(e.target.value) || 0 })}
                className="input-field w-40"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
        
        {/* Invoice Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{calculation.subtotal.toFixed(2)}</span>
            </div>
            {calculation.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>- ₹{calculation.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Amount:</span>
              <span className="font-medium">₹{calculation.taxableAmount.toFixed(2)}</span>
            </div>
            {formData.taxType === 'CGST/SGST' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST ({formData.items[0]?.gstRate || 0}%):</span>
                  <span>₹{calculation.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST ({formData.items[0]?.gstRate || 0}%):</span>
                  <span>₹{calculation.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">IGST ({formData.items[0]?.gstRate || 0}%):</span>
                <span>₹{calculation.igst.toFixed(2)}</span>
              </div>
            )}
            {formData.shippingCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>₹{formData.shippingCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span className="text-blue-600">₹{calculation.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="2"
              placeholder="Thank you for your business!"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="input-field"
              rows="2"
              placeholder="Payment terms: Due within 15 days"
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {editInvoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}