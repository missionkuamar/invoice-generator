import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import ShopSettings from './pages/ShopSettings';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Layout from './components/Layout/Layout';
import SubscriptionPlans from './pages/SubscriptionPlans';


function App() {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!userInfo ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!userInfo ? <Register /> : <Navigate to="/" />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
          <Route path="/subscription" element={<SubscriptionPlans />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/invoices/edit/:id" element={<CreateInvoice />} />
            <Route path="/settings" element={<ShopSettings />} />
            {userInfo?.role === 'super_admin' && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;