import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAllUsers = createAsyncThunk('admin/fetchUsers', async ({ page, search }) => {
  const { data } = await api.get('/admin/users', { params: { page, search } });
  return data;
});

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async () => {
  const { data } = await api.get('/admin/stats');
  return data;
});

export const toggleUserStatus = createAsyncThunk('admin/toggleUser', async (userId) => {
  const { data } = await api.put(`/admin/users/${userId}/toggle`);
  return data;
});

export const deleteUser = createAsyncThunk('admin/deleteUser', async (userId) => {
  await api.delete(`/admin/users/${userId}`);
  return userId;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [],
    stats: null,
    totalPages: 1,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload.user._id);
        if (index !== -1) {
          state.users[index].isActive = action.payload.user.isActive;
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      });
  },
});

export default adminSlice.reducer;