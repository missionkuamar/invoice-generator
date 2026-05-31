import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const userInfo = JSON.parse(localStorage.getItem('userInfo'));

export const login = createAsyncThunk('auth/login', async ({ email, password }) => {
  const data = await authService.login(email, password);
  return data;
});

export const verifyTwoFactor = createAsyncThunk('auth/verify2FA', async ({ userId, twoFactorCode }) => {
  const data = await authService.verifyTwoFactor(userId, twoFactorCode);
  return data;
});

export const register = createAsyncThunk('auth/register', async (userData) => {
  const data = await authService.register(userData);
  return data;
});

export const setup2FA = createAsyncThunk('auth/setup2FA', async () => {
  const data = await authService.setup2FA();
  return data;
});

export const enable2FA = createAsyncThunk('auth/enable2FA', async ({ twoFactorCode }) => {
  const data = await authService.enable2FA(twoFactorCode);
  return data;
});

export const disable2FA = createAsyncThunk('auth/disable2FA', async ({ twoFactorCode }) => {
  const data = await authService.disable2FA(twoFactorCode);
  return data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo: userInfo || null,
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('userInfo');
      state.userInfo = null;
    },
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresTwoFactor) {
          state.twoFactorPending = action.payload;
        } else {
          state.userInfo = action.payload;
          localStorage.setItem('userInfo', JSON.stringify(action.payload));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        localStorage.setItem('userInfo', JSON.stringify(action.payload));
        state.twoFactorPending = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        localStorage.setItem('userInfo', JSON.stringify(action.payload));
      })
      .addCase(enable2FA.fulfilled, (state, action) => {
        if (state.userInfo) {
          state.userInfo.twoFactorEnabled = true;
          localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
        }
      })
      .addCase(disable2FA.fulfilled, (state) => {
        if (state.userInfo) {
          state.userInfo.twoFactorEnabled = false;
          localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
        }
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;