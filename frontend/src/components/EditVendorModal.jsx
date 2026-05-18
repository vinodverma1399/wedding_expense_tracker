import React, { useState } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { toast } from 'react-toastify';

const EditVendorModal = ({ vendor, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    vendorName: vendor.vendorName || '',
    serviceType: vendor.serviceType || 'Photography',
    totalAmount: vendor.totalAmount || '',
    advancePaid: vendor.advancePaid || '',
    contactNumber: vendor.contactNumber || '',
    occasionDate: vendor.occasionDate ? new Date(vendor.occasionDate).toISOString().split('T')[0] : ''
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
        advancePaid: formData.advancePaid || 0
      };
      const { data } = await api.put(`/vendor/update/${vendor._id}`, payload);
      onUpdate(data);
      toast.success('Vendor updated successfully');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vendor');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Vendor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('vendorName')}</label>
            <input type="text" name="vendorName" required value={formData.vendorName} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('serviceType')}</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {services.map(s => <option key={s} value={s}>{t(s.toLowerCase()) || s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('totalAmount')} (₹)</label>
            <input type="number" name="totalAmount" required value={formData.totalAmount} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('advancePaid')} (₹)</label>
            <input type="number" name="advancePaid" value={formData.advancePaid} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contactNumber')}</label>
            <input type="text" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occasion Date</label>
            <input type="date" name="occasionDate" value={formData.occasionDate} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} 
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Vendor'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVendorModal;
