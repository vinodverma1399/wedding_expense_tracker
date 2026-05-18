import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const InviteMemberModal = ({ weddingId, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/wedding/invite/${weddingId}`, { email, role });
      toast.success('Member invited successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite member');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email Address</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="family@example.com"
          className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 dark:text-white" 
        />
        <p className="text-xs text-gray-500 mt-1">They must have an account on this app already.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="Admin">Admin (Can edit everything)</option>
          <option value="Editor">Editor (Can add/edit expenses)</option>
          <option value="Viewer">Viewer (Read-only)</option>
        </select>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">
          Cancel
        </button>
        <button type="submit" disabled={loading} 
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? 'Sending...' : 'Invite'}
        </button>
      </div>
    </form>
  );
};

export default InviteMemberModal;
