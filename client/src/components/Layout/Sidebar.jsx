import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome } from 'react-icons/fi';
import { FiFileText } from 'react-icons/fi';
import { FiPlusCircle } from 'react-icons/fi';
import { FiSettings } from 'react-icons/fi';
import { FiUsers } from 'react-icons/fi';
import { FiBarChart2 } from 'react-icons/fi';
import { FiCreditCard } from 'react-icons/fi';

export default function Sidebar() {
  const { userInfo } = useSelector((state) => state.auth);
  
  const navItems = [
    { to: '/', icon: FiHome, label: 'Dashboard' },
    { to: '/invoices', icon: FiFileText, label: 'Invoices' },
    { to: '/invoices/create', icon: FiPlusCircle, label: 'Create Invoice' },
    { to: '/settings', icon: FiSettings, label: 'Shop Settings' },
    { to: '/subscription', icon: FiCreditCard, label: 'Plans' }
  ];
  
  if (userInfo?.role === 'super_admin') {
    navItems.push({ to: '/admin', icon: FiUsers, label: 'Admin Panel' });
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">InvoiceGen</h1>
        <p className="text-gray-400 text-sm mt-1">SaaS Platform</p>
      </div>
      
      <nav className="flex-1 mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? 'bg-gray-800 text-white border-r-4 border-primary-500' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <FiBarChart2 className="w-4 h-4" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{userInfo?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{userInfo?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}