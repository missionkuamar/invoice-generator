import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, fetchAdminStats, toggleUserStatus, deleteUser } from '../store/slices/adminSlice';
import toast from 'react-hot-toast';
import { FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';

export default function AdminPanel() {
  const dispatch = useDispatch();
  const { users, stats, totalPages, currentPage, isLoading } = useSelector((state) => state.admin);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    dispatch(fetchAllUsers({ page, search }));
    dispatch(fetchAdminStats());
  }, [dispatch, page, search]);
  
  const handleToggleStatus = async (userId) => {
    try {
      await dispatch(toggleUserStatus(userId)).unwrap();
      toast.success('User status updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };
  
  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This will remove all their invoices and data.`)) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage users and platform settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</div>
            <div className="text-gray-500">Total Users</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
            <div className="text-gray-500">Active Users</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats?.totalInvoices || 0}</div>
            <div className="text-gray-500">Total Invoices</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <div className="text-gray-500">Revenue</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold">All Shop Owners</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              className="input-field w-64"
            />
            <button onClick={() => setPage(1)} className="btn-primary">
              Search
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Shop Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Shop Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">GST</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoices</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.shop?.shopName || 'N/A'}</td>
                      <td className="px-4 py-3">{user.shop?.gstNumber || 'Not added'}</td>
                      <td className="px-4 py-3 text-center">{user.invoiceCount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`p-1 rounded ${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          title={user.isActive ? 'Disable User' : 'Enable User'}
                        >
                          {user.isActive ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}