import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function OAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const errorParam = params.get('error');
    
    console.log('📞 OAuth Callback - Token:', token ? '✅ Received' : '❌ Not found');
    
    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      toast.error('Google login failed');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }
    
    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data with the token
      api.get('/auth/me')
        .then(response => {
          console.log('✅ User data received:', response.data);
          const userData = {
            ...response.data,
            token: token
          };
          dispatch(setCredentials(userData));
          localStorage.setItem('userInfo', JSON.stringify(userData));
          toast.success('Google login successful!');
          navigate('/');
        })
        .catch(err => {
          console.error('❌ Failed to fetch user data:', err);
          setError('Failed to authenticate. Please try again.');
          toast.error('Authentication failed');
          setTimeout(() => navigate('/login'), 3000);
        });
    } else {
      console.error('❌ No token found in URL');
      setError('No authentication token found');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [dispatch, navigate, location]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Google login...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we verify your account</p>
      </div>
    </div>
  );
}