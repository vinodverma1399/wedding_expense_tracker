import React, { useState } from 'react';
import api from '../services/api';

const AddVendorForm = ({ weddingId, onSuccess }) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    serviceType: 'Photography',
    totalAmount: '',
    advancePaid: '',
    contactNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const services = ['Venue', 'Catering', 'Decoration', 'Photography', 'Jewellery', 'Travel', 'DJ', 'Makeup', 'Clothes', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        weddingId,
        advancePaid: formData.advancePaid || 0
      };
      const { data } = await api.post('/vendor/add', payload);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
          <input type="text" name="vendorName" required value={formData.vendorName} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select name="serviceType" value={formData.serviceType} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
          <input type="number" name="totalAmount" required value={formData.totalAmount} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
          <input type="number" name="advancePaid" value={formData.advancePaid} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
        <input type="text" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} 
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? 'Adding...' : 'Add Vendor'}
        </button>
      </div>
    </form>
  );
};

export default AddVendorForm;
