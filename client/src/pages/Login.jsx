import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, verifyTwoFactor } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (requires2FA) {
      try {
        await dispatch(verifyTwoFactor({ userId, twoFactorCode })).unwrap();
        toast.success('Login successful!');
        navigate('/');
      } catch (error) {
        toast.error(error.message || 'Invalid 2FA code');
      }
    } else {
      try {
        const result = await dispatch(login({ email, password })).unwrap();
        if (result.requiresTwoFactor) {
          setRequires2FA(true);
          setUserId(result.userId);
          toast.info('Please enter your 2FA code');
        } else {
          toast.success('Login successful!');
          navigate('/');
        }
      } catch (error) {
        toast.error(error.message || 'Login failed');
      }
    }
  };

  const handleGoogleLogin = () => {
       window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Invoice Generator</h1>
          <p className="text-gray-500 mt-2">
            {requires2FA ? 'Enter 2FA Code' : 'Sign in to your account'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Authenticator Code
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="input-field"
                placeholder="Enter 6-digit code"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Open Google Authenticator app and enter the 6-digit code
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (requires2FA ? 'Verify & Login' : 'Sign In')}
          </button>
        </form>
        
        {!requires2FA && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
          </>
        )}
        
        {!requires2FA && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Register here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}