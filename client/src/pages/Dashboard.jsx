import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices } from '../store/slices/invoiceSlice';
import { fetchShopProfile } from '../store/slices/shopSlice';
import { Link } from 'react-router-dom';
import { 
  FiPlusCircle, 
  FiFileText, 
  FiSettings, 
  FiTrendingUp, 
  FiCheckCircle 
} from 'react-icons/fi';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { invoices, totalItems } = useSelector((state) => state.invoices);
  const { profile } = useSelector((state) => state.shop);
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(fetchInvoices({ page: 1, limit: 5 }));
    dispatch(fetchShopProfile());
  }, [dispatch]);
  
  const stats = [
    { title: 'Total Invoices', value: totalItems, icon: FiFileText, color: 'bg-blue-500' },
    { title: 'Pending Amount', value: '₹0', icon: FiTrendingUp, color: 'bg-yellow-500' },
    { title: 'Paid Invoices', value: invoices.filter(i => i.status === 'paid').length, icon: FiCheckCircle, color: 'bg-green-500' },
  ];
  
  const quickActions = [
    { title: 'Create Invoice', description: 'Generate a new invoice', icon: FiPlusCircle, link: '/invoices/create', color: 'text-primary-600' },
    { title: 'View All Invoices', description: 'Manage existing invoices', icon: FiFileText, link: '/invoices', color: 'text-gray-600' },
    { title: 'Shop Settings', description: 'Update your shop profile', icon: FiSettings, link: '/settings', color: 'text-purple-600' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {userInfo?.name}!</h1>
        <p className="mt-2 opacity-90">
          {profile?.shopName} - {profile?.gstNumber ? `GST: ${profile.gstNumber}` : 'Add GST number in settings'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="card flex items-center">
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.link}
            className="card hover:shadow-lg transition-shadow flex items-center"
          >
            <action.icon className={`w-8 h-8 ${action.color}`} />
            <div className="ml-4">
              <h3 className="font-semibold">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Invoices</h2>
          <Link to="/invoices" className="text-primary-600 hover:underline text-sm">
            View All →
          </Link>
        </div>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invoices yet. Create your first invoice!
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">{invoice.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{invoice.grandTotal}</p>
                  <p className={`text-xs ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}