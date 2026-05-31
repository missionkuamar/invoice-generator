import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { FiLogOut, FiBell } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome back, {userInfo?.name}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 hover:text-gray-700">
          <FiBell className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
}