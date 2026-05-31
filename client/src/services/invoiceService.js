import api from './api';

const getInvoices = async (params) => {
  const { data } = await api.get('/invoices', { params });
  return data;
};

const getInvoiceById = async (id) => {
  const { data } = await api.get(`/invoices/${id}`);
  return data;
};

const createInvoice = async (invoiceData) => {
  const formData = new FormData();
  Object.keys(invoiceData).forEach(key => {
    if (key === 'items') {
      formData.append(key, JSON.stringify(invoiceData[key]));
    } else if (key === 'invoiceImage' && invoiceData[key] instanceof File) {
      formData.append('invoiceImage', invoiceData[key]);
    } else if (invoiceData[key] !== undefined && invoiceData[key] !== null) {
      formData.append(key, invoiceData[key]);
    }
  });
  const { data } = await api.post('/invoices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

const updateInvoice = async (id, invoiceData) => {
  const { data } = await api.put(`/invoices/${id}`, invoiceData);
  return data;
};

const deleteInvoice = async (id) => {
  const { data } = await api.delete(`/invoices/${id}`);
  return data;
};

const getRandomInvoice = async () => {
  const { data } = await api.get('/invoices/random');
  return data;
};

// Export all functions
export default {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getRandomInvoice,
};

// Also export named exports for convenience
export {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getRandomInvoice,
};