import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import invoiceService from '../../services/invoiceService';

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async ({ page, limit, search, status, startDate, endDate }) => {
    return await invoiceService.getInvoices({ page, limit, search, status, startDate, endDate });
  }
);

export const createInvoice = createAsyncThunk('invoices/create', async (invoiceData) => {
  return await invoiceService.createInvoice(invoiceData);
});

export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, data }) => {
  return await invoiceService.updateInvoice(id, data);
});

export const deleteInvoice = createAsyncThunk('invoices/delete', async (id) => {
  await invoiceService.deleteInvoice(id);
  return id;
});

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    currentInvoice: null,
    totalPages: 1,
    currentPage: 1,
    totalItems: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = action.payload;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload.invoices;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalItems = action.payload.totalItems;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(i => i._id === action.payload._id);
        if (index !== -1) state.invoices[index] = action.payload;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter(i => i._id !== action.payload);
      });
  },
});

export const { setCurrentInvoice, clearCurrentInvoice } = invoiceSlice.actions;
export default invoiceSlice.reducer;