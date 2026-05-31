import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShopProfile, updateShopProfile, uploadShopLogo, deleteShopLogo } from '../store/slices/shopSlice';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiSave, FiEdit2, FiX } from 'react-icons/fi';

export default function ShopSettings() {
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector((state) => state.shop);
  
  // Section edit states
  const [editingSection, setEditingSection] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  // Form data for each section
  const [basicInfo, setBasicInfo] = useState({
    shopName: '',
    gstNumber: '',
    phone: '',
    email: '',
    invoicePrefix: 'INV',
    footerNote: 'Thank you for your business!',
  });
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  
  useEffect(() => {
    dispatch(fetchShopProfile());
  }, [dispatch]);
  
  useEffect(() => {
    if (profile) {
      setBasicInfo({
        shopName: profile.shopName || '',
        gstNumber: profile.gstNumber || '',
        phone: profile.phone || '',
        email: profile.email || '',
        invoicePrefix: profile.invoicePrefix || 'INV',
        footerNote: profile.footerNote || 'Thank you for your business!',
      });
      setAddress(profile.address || { street: '', city: '', state: '', pincode: '' });
      setBankDetails(profile.bankDetails || { accountName: '', accountNumber: '', ifscCode: '', bankName: '' });
      if (profile.shopLogo) {
        setLogoPreview(profile.shopLogo);
      }
    }
  }, [profile]);
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  
  const uploadLogo = async () => {
    if (!logoFile) {
      toast.error('Please select a file first');
      return;
    }
    
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    try {
      const result = await dispatch(uploadShopLogo(formData)).unwrap();
      toast.success('Logo uploaded successfully');
      setLogoFile(null);
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    }
  };
  
  const handleDeleteLogo = async () => {
    if (window.confirm('Are you sure you want to delete your shop logo?')) {
      try {
        await dispatch(deleteShopLogo()).unwrap();
        setLogoPreview('');
        toast.success('Logo deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Delete failed');
      }
    }
  };
  
  const saveSection = async (section, data) => {
    try {
      await dispatch(updateShopProfile({ section, data })).unwrap();
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} information updated successfully`);
      setEditingSection(null);
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };
  
  const SectionCard = ({ title, section, editing, onEdit, onSave, onCancel, children }) => (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
  
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shop Settings</h1>
        <p className="text-gray-500 mt-1">Manage your shop profile and invoice settings</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Shop Logo</h3>
            <div className="text-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Shop Logo"
                  className="w-32 h-32 object-contain mx-auto mb-4 rounded-lg border p-2"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-sm text-center">No Logo</span>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="mb-3 text-sm w-full"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={uploadLogo}
                  disabled={!logoFile}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiUpload className="w-4 h-4" />
                  Upload
                </button>
                {logoPreview && (
                  <button
                    onClick={handleDeleteLogo}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Recommended: Square image, max 2MB (JPG, PNG, WEBP)
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Section */}
          <SectionCard
            title="Basic Information"
            section="basic"
            editing={editingSection === 'basic'}
            onEdit={() => setEditingSection('basic')}
            onSave={() => saveSection('basic', basicInfo)}
            onCancel={() => setEditingSection(null)}
          >
            {editingSection === 'basic' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
                  <input
                    type="text"
                    value={basicInfo.shopName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, shopName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={basicInfo.gstNumber}
                      onChange={(e) => setBasicInfo({ ...basicInfo, gstNumber: e.target.value })}
                      className="input-field"
                      placeholder="Enter GST number if registered"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={basicInfo.phone}
                      onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={basicInfo.email}
                      onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                    <input
                      type="text"
                      value={basicInfo.invoicePrefix}
                      onChange={(e) => setBasicInfo({ ...basicInfo, invoicePrefix: e.target.value })}
                      className="input-field"
                      placeholder="INV"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Note</label>
                  <textarea
                    value={basicInfo.footerNote}
                    onChange={(e) => setBasicInfo({ ...basicInfo, footerNote: e.target.value })}
                    className="input-field"
                    rows="2"
                    placeholder="Thank you for your business!"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Shop Name</p>
                    <p className="font-medium">{basicInfo.shopName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <p className="font-medium">{basicInfo.gstNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{basicInfo.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{basicInfo.email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Prefix</p>
                    <p className="font-medium">{basicInfo.invoicePrefix || 'INV'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Footer Note</p>
                  <p className="text-sm">{basicInfo.footerNote || 'Not set'}</p>
                </div>
              </div>
            )}
          </SectionCard>
          
          {/* Address Section */}
          <SectionCard
            title="Address"
            section="address"
            editing={editingSection === 'address'}
            onEdit={() => setEditingSection('address')}
            onSave={() => saveSection('address', address)}
            onCancel={() => setEditingSection(null)}
          >
            {editingSection === 'address' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Full Address</p>
                <p className="text-gray-700">
                  {address.street ? (
                    <>
                      {address.street}<br />
                      {address.city && `${address.city}, `}
                      {address.state && `${address.state} `}
                      {address.pincode && `- ${address.pincode}`}
                    </>
                  ) : 'No address added yet'}
                </p>
              </div>
            )}
          </SectionCard>
          
          {/* Bank Details Section */}
          <SectionCard
            title="Bank Details"
            section="bank"
            editing={editingSection === 'bank'}
            onEdit={() => setEditingSection('bank')}
            onSave={() => saveSection('bank', bankDetails)}
            onCancel={() => setEditingSection(null)}
          >
            {editingSection === 'bank' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                      className="input-field"
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="font-medium">{bankDetails.accountName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium">
                      {bankDetails.accountNumber ? '••••' + bankDetails.accountNumber.slice(-4) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IFSC Code</p>
                    <p className="font-medium">{bankDetails.ifscCode || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-medium">{bankDetails.bankName || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}