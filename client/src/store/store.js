import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import invoiceReducer from './slices/invoiceSlice';
import shopReducer from './slices/shopSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    invoices: invoiceReducer,
    shop: shopReducer,
    admin: adminReducer,
  },
});