import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, deleteInvoice } from '../../store/slices/invoiceSlice';
import { generatePDF, generateInvoiceHTML } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { FiDownload, FiTrash2, FiEdit } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function InvoiceList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, currentPage, totalPages, isLoading } = useSelector((state) => state.invoices);
  const { profile: shopProfile } = useSelector((state) => state.shop);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    loadInvoices(1);
  }, []);
  
  const loadInvoices = (newPage) => {
    dispatch(fetchInvoices({ page: newPage, limit: 10, search, status: statusFilter }));
    setPage(newPage);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await dispatch(deleteInvoice(id));
      toast.success('Invoice deleted');
      loadInvoices(page);
    }
  };
  
  const handleDownloadPDF = (invoice) => {
    if (!shopProfile) {
      toast.error('Shop profile not loaded');
      return;
    }
    const element = document.createElement('div');
    element.innerHTML = generateInvoiceHTML(shopProfile, invoice);
    document.body.appendChild(element);
    generatePDF(element, shopProfile, invoice);
    document.body.removeChild(element);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">All Invoices</h2>
        <div className="flex space-x-3 flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              loadInvoices(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-40"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadInvoices(1)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
          />
          <button 
            onClick={() => loadInvoices(1)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{invoice.customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{invoice.grandTotal}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => navigate(`/invoices/edit/${invoice._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FiEdit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="text-green-600 hover:text-green-800"
                        title="Download PDF"
                      >
                        <FiDownload className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => loadInvoices(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadInvoices(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}