import api from './api';

const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

const verifyTwoFactor = async (userId, twoFactorCode) => {
  const { data } = await api.post('/auth/login', { userId, twoFactorCode });
  return data;
};

const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

const setup2FA = async () => {
  const { data } = await api.post('/auth/2fa/setup');
  return data;
};

const enable2FA = async (twoFactorCode) => {
  const { data } = await api.post('/auth/2fa/enable', { twoFactorCode });
  return data;
};

const disable2FA = async (twoFactorCode) => {
  const { data } = await api.post('/auth/2fa/disable', { twoFactorCode });
  return data;
};

const verifyBackupCode = async (backupCode) => {
  const { data } = await api.post('/auth/2fa/verify-backup', { backupCode });
  return data;
};

export default {
  login,
  verifyTwoFactor,
  register,
  setup2FA,
  enable2FA,
  disable2FA,
  verifyBackupCode,
};