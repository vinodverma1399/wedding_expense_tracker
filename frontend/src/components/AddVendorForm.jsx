import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const AddVendorForm = ({ weddingId, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    vendorName: '',
    serviceType: 'Photography',
    totalAmount: '',
    advancePaid: '',
    contactNumber: '',
    occasionDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [unregisteredVendors, setUnregisteredVendors] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    const fetchExpensesAndVendors = async () => {
      try {
        const [expensesRes, vendorsRes] = await Promise.all([
          api.get(`/expense/${weddingId}`),
          api.get(`/vendor/${weddingId}`)
        ]);
        
        const expenses = expensesRes.data;
        const registeredVendors = vendorsRes.data;
        
        setAllExpenses(expenses);
        
        // Extract all unique expense vendors that are NOT registered yet
        const registeredNames = new Set(registeredVendors.map(v => v.vendorName.toLowerCase().trim()));
        
        const uniqueUnregistered = [];
        const seen = new Set();
        
        expenses.forEach(exp => {
          if (exp.vendor && exp.vendor.trim()) {
            const normalized = exp.vendor.toLowerCase().trim();
            if (!registeredNames.has(normalized) && !seen.has(normalized)) {
              seen.add(normalized);
              uniqueUnregistered.push({
                name: exp.vendor.trim(),
                category: exp.category
              });
            }
          }
        });
        
        setUnregisteredVendors(uniqueUnregistered);
      } catch (err) {
        console.error('Error fetching unregistered vendors:', err);
      }
    };
    if (weddingId) {
      fetchExpensesAndVendors();
    }
  }, [weddingId]);

  const handleSelectUnregisteredVendor = (e) => {
    const name = e.target.value;
    if (!name) {
      setFormData({
        vendorName: '',
        serviceType: 'Photography',
        totalAmount: '',
        advancePaid: '',
        contactNumber: '',
        occasionDate: ''
      });
      return;
    }
    
    // Filter expenses matching this vendor name
    const matches = allExpenses.filter(exp => exp.vendor && exp.vendor.toLowerCase().trim() === name.toLowerCase().trim());
    
    if (matches.length > 0) {
      // Service type matching category of the first expense
      const serviceType = matches[0].category || 'Photography';
      
      // Calculate total amount (Deal Price) and advance paid
      const totalAmount = matches.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const advancePaid = matches.reduce((sum, exp) => {
        if (exp.paymentStatus === 'Paid') {
          return sum + (Number(exp.amount) || 0);
        } else if (exp.paymentStatus === 'Partial') {
          return sum + (Number(exp.paidAmount) || 0);
        }
        return sum;
      }, 0);
      
      const occasionDate = matches[0].expenseDate ? new Date(matches[0].expenseDate).toISOString().split('T')[0] : '';
      
      setFormData(prev => ({
        ...prev,
        vendorName: matches[0].vendor,
        serviceType,
        totalAmount: totalAmount || '',
        advancePaid: advancePaid || '',
        occasionDate
      }));
    }
  };

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
      
      {unregisteredVendors.length > 0 && (
        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
          <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1.5">
            📋 Auto-Fill from Unregistered Expenses
          </label>
          <select 
            onChange={handleSelectUnregisteredVendor}
            className="w-full p-2 text-sm border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">-- Choose Unregistered Expense Vendor --</option>
            {unregisteredVendors.map(uv => (
              <option key={uv.name} value={uv.name}>
                {uv.name} ({uv.category})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            💡 <strong>Pro-Tip:</strong> Selecting a vendor from here will automatically fetch their service type, total deal price, and advance paid directly from all recorded expenses!
          </p>
        </div>
      )}
      
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

      <div className="pt-4">
        <button type="submit" disabled={loading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? t('adding') : t('addVendor')}
        </button>
      </div>
    </form>
  );
};

export default AddVendorForm;
