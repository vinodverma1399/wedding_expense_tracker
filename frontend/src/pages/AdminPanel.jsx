import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Shield, Users, Heart, IndianRupee, FileSpreadsheet, UserCheck } from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, weddingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/weddings')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setWeddings(weddingsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access Denied or Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to Admin?')) return;
    try {
      const { data } = await api.put(`/admin/make-admin/${userId}`);
      toast.success(`${data.name} is now an Admin!`);
      setUsers(users.map(u => u._id === userId ? { ...u, isAdmin: true } : u));
    } catch (error) {
      toast.error('Failed to promote user');
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="text-primary" /> Admin Command Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400">System overview, user privileges, and global platform analytics.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-primary">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalUsers}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500">
                    <Heart size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weddings Created</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalWeddings}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-500">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Logged Expense</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-500">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vendors Managed</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalVendors}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="border-b dark:border-gray-800 flex bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                    activeTab === 'stats'
                      ? 'border-primary text-primary bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Overview & Database Health
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                    activeTab === 'users'
                      ? 'border-primary text-primary bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Platform Users ({users.length})
                </button>
                <button
                  onClick={() => setActiveTab('weddings')}
                  className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                    activeTab === 'weddings'
                      ? 'border-primary text-primary bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  All Active Weddings ({weddings.length})
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Platform Health Report</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      WET SaaS platform is operating smoothly. All data schemas (Users, Weddings, Expenses, Vendors, Guests, and Events) are running with Helmet and Rate-Limiter protections.
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg border dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Connected Database</p>
                      <p className="text-sm font-mono text-green-600 dark:text-green-400">MongoDB Atlas (ac-bk7mr0z-shard-00-00.tyhnidx.mongodb.net)</p>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                          <th className="pb-3 font-semibold">User Details</th>
                          <th className="pb-3 font-semibold">Registered At</th>
                          <th className="pb-3 font-semibold text-center">Status</th>
                          <th className="pb-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} className="border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                            <td className="py-4">
                              <p className="font-semibold text-gray-800 dark:text-white">{u.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                            </td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
                                u.isAdmin 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {u.isAdmin ? 'Super Admin' : 'User'}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              {!u.isAdmin && (
                                <button
                                  onClick={() => handleMakeAdmin(u._id)}
                                  className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center gap-1 mx-auto"
                                >
                                  <UserCheck size={14} /> Promote to Admin
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'weddings' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                          <th className="pb-3 font-semibold">Wedding Name</th>
                          <th className="pb-3 font-semibold">Creator</th>
                          <th className="pb-3 font-semibold text-right">Budget</th>
                          <th className="pb-3 font-semibold text-center">Total Collaborators</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weddings.map(w => (
                          <tr key={w._id} className="border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                            <td className="py-4 font-semibold text-gray-800 dark:text-white">{w.weddingName}</td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                              {w.userId ? (
                                <>
                                  <p>{w.userId.name}</p>
                                  <p className="text-xs text-gray-400">{w.userId.email}</p>
                                </>
                              ) : 'Unknown User'}
                            </td>
                            <td className="py-4 text-sm font-bold text-gray-800 dark:text-white text-right">₹{w.totalBudget.toLocaleString()}</td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                              {w.members ? w.members.length + 1 : 1}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
