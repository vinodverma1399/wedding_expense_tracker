import React, { useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { toast } from 'react-toastify';
import { Calendar, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';

const PayExpenseModal = ({ expense, onClose, onSuccess }) => {
  const remaining = expense.amount - (expense.paidAmount || 0);
  const [payAmount, setPayAmount] = useState(remaining);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    const newPaidAmount = (expense.paidAmount || 0) + parsedPay;
    const newStatus = newPaidAmount === expense.amount ? 'Paid' : 'Partial';

    const newPaymentEntry = {
      amountPaid: parsedPay,
      paymentMethod,
      paidAt: new Date()
    };
    const updatedHistory = [...(expense.paymentHistory || []), newPaymentEntry];

    try {
      const { data } = await api.put(`/expense/update/${expense._id}`, {
        amount: expense.amount,
        paymentStatus: newStatus,
        paidAmount: newPaidAmount,
        paymentMethod,
        paymentHistory: updatedHistory
      });
      toast.success('Payment recorded successfully!');
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
      setLoading(false);
    }
  };

  const isFullyPaid = remaining === 0;

  return (
    <Modal isOpen={true} onClose={onClose} title={isFullyPaid ? "Payment History" : "Record Payment"} size={isFullyPaid ? "md" : "lg"}>
      {isFullyPaid ? (
        /* Read-only Timeline history for fully paid expense */
        <div className="space-y-6 text-gray-900 dark:text-white">
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} className="animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-green-800 dark:text-green-400">Fully Paid</h4>
              <p className="text-xs text-green-600 dark:text-green-500">All installments cleared successfully.</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-2 border dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Expense Category:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{expense.category}</span>
            </div>
            {expense.vendor && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{expense.vendor}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t dark:border-gray-800/60">
              <span className="text-gray-700 dark:text-gray-300">Total Spent:</span>
              <span className="text-primary">₹{expense.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b dark:border-gray-800 pb-2">
              <CreditCard size={16} className="text-primary" />
              Installments Cleared
            </h4>

            {(!expense.paymentHistory || expense.paymentHistory.length === 0) ? (
              <p className="text-xs text-gray-500 text-center py-4">No installments logged.</p>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-green-100 dark:before:bg-green-950">
                {expense.paymentHistory.map((item, idx) => (
                  <div key={item._id || idx} className="relative group">
                    <div className="absolute -left-[14.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 group-hover:scale-125 transition duration-200" />
                    
                    <div className="bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/40 p-3 rounded-xl border dark:border-gray-800/50 transition">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                          ₹{item.amountPaid.toLocaleString()}
                        </span>
                        <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-medium px-2 py-0.5 rounded-full border dark:border-green-800/30">
                          {item.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <ChevronRight size={10} className="text-green-400" />
                        {new Date(item.paidAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Existing grid for partial payment recording */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900 dark:text-white max-h-[85vh] overflow-y-auto pr-1">
          {/* Left Side: Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
            
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-2 border dark:border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Expense:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{expense.category} {expense.vendor && `(${expense.vendor})`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{expense.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Paid So Far:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">₹{(expense.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-800/60 font-bold">
                <span className="text-gray-600 dark:text-gray-300">Remaining Balance:</span>
                <span className="text-red-500 dark:text-red-400">₹{remaining.toLocaleString()}</span>
              </div>
            </div>

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

          {/* Right Side: Payment History / Installments */}
          <div className="border-t md:border-t-0 md:border-l dark:border-gray-800 pt-6 md:pt-0 md:pl-6 space-y-4">
            <h4 className="font-bold text-base text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b dark:border-gray-800 pb-2">
              <CreditCard size={18} className="text-primary" />
              Payment Installment History
            </h4>

            {(!expense.paymentHistory || expense.paymentHistory.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-500">
                <Calendar size={32} className="opacity-40 mb-2 animate-bounce" />
                <p className="text-xs">No payment history found.</p>
                <p className="text-[10px] opacity-80 mt-0.5">Payments recorded here will build a ledger list.</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-purple-100 dark:before:bg-purple-950">
                {expense.paymentHistory.map((item, idx) => (
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
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <ChevronRight size={10} className="text-purple-400" />
                        {new Date(item.paidAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PayExpenseModal;
