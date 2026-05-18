import React, { useState } from 'react';
import api from '../services/api';

const CreateWeddingForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    weddingName: '',
    brideName: '',
    groomName: '',
    weddingDate: '',
    city: '',
    totalBudget: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/wedding/create', formData);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Name</label>
        <input type="text" name="weddingName" required value={formData.weddingName} onChange={handleChange} 
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Rahul & Anjali's Wedding" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bride Name</label>
          <input type="text" name="brideName" required value={formData.brideName} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Groom Name</label>
          <input type="text" name="groomName" required value={formData.groomName} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" name="weddingDate" required value={formData.weddingDate} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" name="city" required value={formData.city} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Estimated Budget (₹)</label>
        <input type="number" name="totalBudget" required value={formData.totalBudget} onChange={handleChange} 
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 1500000" />
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Wedding'}
        </button>
      </div>
    </form>
  );
};

export default CreateWeddingForm;
