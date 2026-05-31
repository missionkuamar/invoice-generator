import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchShopProfile = createAsyncThunk('shop/fetchProfile', async () => {
  const { data } = await api.get('/shop/profile');
  return data;
});

export const updateShopProfile = createAsyncThunk('shop/updateProfile', async ({ section, data }) => {
  const { data: response } = await api.put('/shop/profile', { section, data });
  return response.shop;
});

export const uploadShopLogo = createAsyncThunk('shop/uploadLogo', async (formData) => {
  const { data } = await api.post('/shop/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
});

export const deleteShopLogo = createAsyncThunk('shop/deleteLogo', async () => {
  const { data } = await api.delete('/shop/delete-logo');
  return data;
});

const shopSlice = createSlice({
  name: 'shop',
  initialState: {
    profile: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchShopProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchShopProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(updateShopProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(uploadShopLogo.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.shopLogo = action.payload.logoUrl;
        }
      })
      .addCase(deleteShopLogo.fulfilled, (state) => {
        if (state.profile) {
          state.profile.shopLogo = '';
        }
      });
  },
});

export default shopSlice.reducer;