import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';

const NotificationBell = ({ selectedWedding }) => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!selectedWedding) return;
    generateAlerts();
  }, [selectedWedding]);

  const generateAlerts = async () => {
    const newAlerts = [];
    try {
      const [expRes, venRes] = await Promise.all([
        api.get(`/expense/${selectedWedding._id}`),
        api.get(`/vendor/${selectedWedding._id}`)
      ]);
      const expenses = expRes.data;
      const vendors = venRes.data;

      const totalSpent = expenses.reduce((a, e) => a + e.amount, 0);
      const budget = selectedWedding.totalBudget || 0;
      const pct = budget > 0 ? (totalSpent / budget) * 100 : 0;

      // Budget alerts
      if (pct >= 100) {
        newAlerts.push({ type: 'danger', msg: `Budget exceeded! Spent ₹${totalSpent.toLocaleString()} of ₹${budget.toLocaleString()}` });
      } else if (pct >= 80) {
        newAlerts.push({ type: 'warning', msg: `${pct.toFixed(0)}% budget used — ₹${(budget - totalSpent).toLocaleString()} remaining.` });
      }

      // Pending vendor payments
      const pending = vendors.filter(v => v.remainingAmount > 0);
      if (pending.length > 0) {
        const total = pending.reduce((a, v) => a + v.remainingAmount, 0);
        newAlerts.push({ type: 'info', msg: `${pending.length} vendor(s) have pending balance of ₹${total.toLocaleString()}` });
      }

      // Pending expenses
      const pendingExp = expenses.filter(e => e.paymentStatus === 'Pending').length;
      if (pendingExp > 0) {
        newAlerts.push({ type: 'warning', msg: `${pendingExp} expense(s) are marked as Pending payment.` });
      }

    } catch (e) { /* silent */ }
    setAlerts(newAlerts);
  };

  const colorMap = {
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-2">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">All good! No alerts.</p>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm font-medium ${colorMap[alert.type]}`}>
                  {alert.msg}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
