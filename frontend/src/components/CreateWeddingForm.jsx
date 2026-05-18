import React, { useState } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const CreateWeddingForm = ({ onSuccess }) => {
  const { t } = useTranslation();
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('weddingName')}</label>
        <input type="text" name="weddingName" required value={formData.weddingName} onChange={handleChange} 
          className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Rahul & Anjali's Wedding" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('brideName')}</label>
          <input type="text" name="brideName" required value={formData.brideName} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('groomName')}</label>
          <input type="text" name="groomName" required value={formData.groomName} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
          <input type="date" name="weddingDate" required value={formData.weddingDate} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('city')}</label>
          <input type="text" name="city" required value={formData.city} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('totalEstimatedBudget')} (₹)</label>
        <input type="number" name="totalBudget" required value={formData.totalBudget} onChange={handleChange} 
          className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. 1500000" />
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? t('creating') : t('createWedding')}
        </button>
      </div>
    </form>
  );
};

export default CreateWeddingForm;
