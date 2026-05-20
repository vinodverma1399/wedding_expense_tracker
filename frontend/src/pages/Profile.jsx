import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { LogOut, User, Mail, Calendar, MapPin, DollarSign, Check, Heart, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

const Profile = () => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [weddings, setWeddings] = useState([]);
  const [activeWeddingId, setActiveWeddingId] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit user profile states
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit wedding states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWeddingId, setEditingWeddingId] = useState('');
  const [editWeddingName, setEditWeddingName] = useState('');
  const [editBrideName, setEditBrideName] = useState('');
  const [editGroomName, setEditGroomName] = useState('');
  const [editWeddingDate, setEditWeddingDate] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editTotalBudget, setEditTotalBudget] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWeddings();
  }, [user]);

  const fetchWeddings = async () => {
    try {
      const { data } = await api.get('/wedding/all');
      setWeddings(data);
      const savedId = localStorage.getItem('selectedWeddingId');
      setActiveWeddingId(savedId || (data[0]?._id || ''));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAgentActive = (weddingId) => {
    localStorage.setItem('selectedWeddingId', weddingId);
    setActiveWeddingId(weddingId);
    toast.success('Active wedding workspace switched!');
    // Trigger storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      const { data } = await api.put('/auth/update-name', { name });
      // Update local storage user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userInfo.name = data.name;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      // Reload page to refresh context state
      toast.success('Name updated successfully!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWedding = async (weddingId) => {
    if (!window.confirm('Are you sure you want to delete this wedding workspace? This will permanently delete all expenses, vendors, guests, and events.')) {
      return;
    }
    try {
      await api.delete(`/wedding/delete/${weddingId}`);
      toast.success('Wedding workspace deleted successfully!');
      if (activeWeddingId === weddingId) {
        localStorage.removeItem('selectedWeddingId');
      }
      fetchWeddings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete wedding');
    }
  };

  const openEditModal = (wedding) => {
    setEditingWeddingId(wedding._id);
    setEditWeddingName(wedding.weddingName);
    setEditBrideName(wedding.brideName);
    setEditGroomName(wedding.groomName);
    const dateStr = wedding.weddingDate ? new Date(wedding.weddingDate).toISOString().substring(0, 10) : '';
    setEditWeddingDate(dateStr);
    setEditCity(wedding.city);
    setEditTotalBudget(wedding.totalBudget);
    setIsEditModalOpen(true);
  };

  const handleEditWeddingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/wedding/update/${editingWeddingId}`, {
        weddingName: editWeddingName,
        brideName: editBrideName,
        groomName: editGroomName,
        weddingDate: editWeddingDate,
        city: editCity,
        totalBudget: Number(editTotalBudget)
      });
      toast.success('Wedding workspace updated successfully!');
      setIsEditModalOpen(false);
      fetchWeddings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update wedding workspace');
    }
  };

  const handleRemoveMember = async (weddingId, memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the wedding group?')) {
      return;
    }
    try {
      await api.post(`/wedding/remove-member/${weddingId}`, { memberUserId });
      toast.success('Member removed from the group successfully!');
      fetchWeddings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove member');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account and wedding workspaces.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Details Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-purple-600"></div>
              
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary font-black text-3xl flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-900 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center justify-center gap-1">
                <Mail size={14} /> {user.email}
              </p>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-left border-t dark:border-gray-800 pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Edit Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating || name.trim() === user.name}
                  className="w-full bg-primary hover:bg-purple-800 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-bold transition shadow-sm cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : 'Save Name'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t dark:border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold rounded-lg transition border border-transparent hover:border-red-100 dark:hover:border-red-900/50 cursor-pointer"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Weddings Settings */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Heart size={20} className="text-primary fill-primary/10" /> My Weddings
              </h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading workspaces...</div>
              ) : weddings.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed dark:border-gray-800 rounded-xl">
                  <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No wedding workspace found.</p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="mt-3 text-sm font-bold text-primary hover:underline cursor-pointer"
                  >
                    Go back to create one
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {weddings.map((wedding) => {
                    const isOwner = wedding.userId?._id === user._id || wedding.userId === user._id;
                    const role = isOwner ? 'Admin/Owner' : (wedding.members?.find(m => m.user?._id === user._id || m.user === user._id)?.role || 'Member');
                    const isActive = activeWeddingId === wedding._id;
                    
                    return (
                      <div 
                        key={wedding._id}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          isActive 
                            ? 'bg-purple-50/50 dark:bg-purple-950/10 border-primary shadow-sm' 
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-800 dark:text-white text-base">{wedding.weddingName}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOwner ? 'bg-purple-100 dark:bg-purple-950 text-primary' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                              }`}>
                                {role}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-bold bg-green-100 dark:bg-green-950 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Check size={10} /> Active Workspace
                                </span>
                              )}
                            </div>

                            {/* Wedding Details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart size={12} className="text-red-400" /> Bride & Groom:
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {wedding.brideName} & {wedding.groomName}
                              </span>

                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> Date:
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date(wedding.weddingDate).toLocaleDateString()}
                              </span>

                              <span className="flex items-center gap-1">
                                <MapPin size={12} /> City:
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {wedding.city}
                              </span>

                              <span className="flex items-center gap-1">
                                <DollarSign size={12} /> Total Budget:
                              </span>
                              <span className="font-bold text-primary">
                                ₹{wedding.totalBudget?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            {!isActive && (
                              <button
                                onClick={() => handleSetAgentActive(wedding._id)}
                                className="flex-1 sm:flex-none text-xs font-bold bg-primary hover:bg-purple-800 text-white px-3 py-2 rounded-lg transition cursor-pointer"
                              >
                                Set Active
                              </button>
                            )}
                            {isOwner && (
                              <>
                                <button
                                  onClick={() => openEditModal(wedding)}
                                  className="p-2 text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-transparent hover:border-purple-100 dark:hover:border-purple-900 rounded-lg transition cursor-pointer"
                                  title="Edit Workspace"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteWedding(wedding._id)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900 rounded-lg transition cursor-pointer"
                                  title="Delete Workspace"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Group Members List */}
                        <div className="mt-3">
                          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Group Members</p>
                          <div className="space-y-2">
                            {/* Creator details */}
                            <div className="flex items-center justify-between text-xs py-1 px-2 bg-gray-100/50 dark:bg-gray-800/40 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-primary font-bold flex items-center justify-center text-[10px]">
                                  {wedding.userId?.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {wedding.userId?.name || 'Wedding Creator'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">({wedding.userId?.email})</span>
                              </div>
                              <span className="text-[9px] bg-purple-100 dark:bg-purple-950/50 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Owner / Creator</span>
                            </div>

                            {/* Additional Invited Members */}
                            {wedding.members && wedding.members.map((member) => (
                              <div key={member.user?._id || member.user} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-gray-100/30 dark:hover:bg-gray-800/20 rounded-lg transition">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                                    {member.user?.name?.charAt(0).toUpperCase() || 'M'}
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {member.user?.name || 'Invited User'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">({member.user?.email || 'No email'})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] bg-blue-100 dark:bg-blue-950/50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {member.role}
                                  </span>
                                  {isOwner && (
                                    <button 
                                      onClick={() => handleRemoveMember(wedding._id, member.user?._id || member.user)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded transition cursor-pointer"
                                      title="Remove Member"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {(!wedding.members || wedding.members.length === 0) && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 italic pl-2">No other members in this group yet.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>


      {/* Edit Wedding Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Wedding Details">
        <form onSubmit={handleEditWeddingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Wedding Name</label>
            <input
              type="text"
              required
              value={editWeddingName}
              onChange={(e) => setEditWeddingName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bride Name</label>
              <input
                type="text"
                required
                value={editBrideName}
                onChange={(e) => setEditBrideName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Groom Name</label>
              <input
                type="text"
                required
                value={editGroomName}
                onChange={(e) => setEditGroomName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Wedding Date</label>
              <input
                type="date"
                required
                value={editWeddingDate}
                onChange={(e) => setEditWeddingDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input
                type="text"
                required
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Budget (₹)</label>
            <input
              type="number"
              required
              value={editTotalBudget}
              onChange={(e) => setEditTotalBudget(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-purple-800 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Update Details
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
