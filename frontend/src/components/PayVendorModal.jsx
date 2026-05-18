import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { toast } from 'react-toastify';
import { CreditCard, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';

const PayVendorModal = ({ vendor, onClose, onUpdate }) => {
  const remaining = vendor.totalAmount - (vendor.advancePaid || 0);
  const [payAmount, setPayAmount] = useState(remaining);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [historyList, setHistoryList] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const { data: expenses } = await api.get(`/expense/${vendor.weddingId}`);
      // Filter expenses matching this vendor's name (case-insensitive)
      const vendorExpenses = expenses.filter(exp => 
        exp.vendor && exp.vendor.toLowerCase().trim() === vendor.vendorName.toLowerCase().trim()
      );
      
      const extracted = [];
      vendorExpenses.forEach(exp => {
        if (exp.paymentHistory && exp.paymentHistory.length > 0) {
          exp.paymentHistory.forEach(item => {
            extracted.push({
              _id: item._id,
              amountPaid: item.amountPaid,
              paymentMethod: item.paymentMethod,
              paidAt: item.paidAt,
              expenseCategory: exp.category,
              note: exp.note
            });
          });
        } else if (exp.paymentStatus === 'Paid' || exp.paymentStatus === 'Partial') {
          extracted.push({
            amountPaid: exp.paidAmount || exp.amount,
            paymentMethod: exp.paymentMethod || 'UPI',
            paidAt: exp.expenseDate || exp.createdAt,
            expenseCategory: exp.category,
            note: exp.note
          });
        }
      });
      
      // Sort by paidAt descending
      extracted.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      setHistoryList(extracted);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (vendor.weddingId) {
      fetchHistory();
    }
  }, [vendor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedPay = Number(payAmount);
    if (isNaN(parsedPay) || parsedPay <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }
    if (parsedPay > remaining) {
      setError(`Cannot pay more than remaining balance of ₹${remaining.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post(`/vendor/pay/${vendor._id}`, {
        payAmount: parsedPay,
        paymentMethod
      });
      toast.success('Payment recorded and logged under Expenses successfully!');
      onUpdate(data);
      // Re-fetch the history instantly
      await fetchHistory();
      // Set remaining and pay amount
      const newRemaining = remaining - parsedPay;
      setPayAmount(newRemaining);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={remaining <= 0 ? "Payment History" : "Record Vendor Payment"} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900 dark:text-white max-h-[85vh] overflow-y-auto pr-1">
        
        {/* Left Side: Form & Status Details */}
        <div className="space-y-4">
          {remaining <= 0 ? (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 size={24} className="animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-green-800 dark:text-green-400">All Settled!</h4>
                <p className="text-xs text-green-600 dark:text-green-500">This vendor deal has been fully cleared.</p>
              </div>
            </div>
          ) : null}

          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-2 border dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Vendor Name:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{vendor.vendorName} ({vendor.serviceType})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Deal Price:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">₹{vendor.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Paid So Far:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">₹{(vendor.advancePaid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-800/60 font-bold">
              <span className="text-gray-600 dark:text-gray-300">Outstanding Balance:</span>
              <span className={remaining > 0 ? "text-red-500 dark:text-red-400" : "text-green-500"}>
                {remaining > 0 ? `₹${remaining.toLocaleString()}` : 'Settled'}
              </span>
            </div>
          </div>

          {remaining > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paying Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  max={remaining}
                  min="1"
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  placeholder="Enter amount to pay"
                  className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} 
                  className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50 shadow-md shadow-primary/20"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Consolidated Payment History / Installments */}
        <div className="border-t md:border-t-0 md:border-l dark:border-gray-800 pt-6 md:pt-0 md:pl-6 space-y-4">
          <h4 className="font-bold text-base text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b dark:border-gray-800 pb-2">
            <CreditCard size={18} className="text-primary" />
            Consolidated Installment History
          </h4>

          {fetchingHistory ? (
            <p className="text-xs text-gray-500 text-center py-4">Fetching installment history...</p>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-500">
              <Calendar size={32} className="opacity-40 mb-2 animate-bounce" />
              <p className="text-xs">No payment history found.</p>
              <p className="text-[10px] opacity-80 mt-0.5">Payments logged in expenses will show up here.</p>
            </div>
          ) : (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-purple-100 dark:before:bg-purple-950 overflow-y-auto max-h-[50vh] pr-1">
              {historyList.map((item, idx) => (
                <div key={item._id || idx} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[14.5px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-gray-900 group-hover:scale-125 transition duration-200" />
                  
                  {/* Card Content */}
                  <div className="bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/40 p-3 rounded-xl border dark:border-gray-800/50 transition">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                        ₹{item.amountPaid.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-primary dark:text-purple-300 font-medium px-2 py-0.5 rounded-full border dark:border-purple-800/30">
                        {item.paymentMethod}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                        "{item.note}"
                      </p>
                    )}
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex justify-between items-center">
                      <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 uppercase tracking-wider font-semibold">
                        {item.expenseCategory}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <ChevronRight size={10} className="text-purple-400" />
                        {new Date(item.paidAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default PayVendorModal;
