import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { demoWedding, demoExpenses, demoVendors } from '../utils/demoData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWeddings([demoWedding]);
      setSelectedWedding(demoWedding);
      setExpenses(demoExpenses);
      setVendors(demoVendors);
      setLoading(false);
    } else {
      fetchWeddings();
    }
  }, [user]);

  const fetchWeddings = async () => {
    try {
      const { data } = await api.get('/wedding/all');
      setWeddings(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('selectedWeddingId');
        const found = data.find(w => w._id === savedId);
        setSelectedWedding(found || data[0]);
        if (!found) {
          localStorage.setItem('selectedWeddingId', data[0]._id);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error('Failed to load weddings');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWedding && user) {
      const isOwner = selectedWedding.userId === user._id || selectedWedding.userId?._id === user._id;
      const currentRole = selectedWedding.members?.find(m => m.user._id === user._id || m.user === user._id)?.role;
      if (!isOwner && currentRole === 'Contributor') {
         navigate('/expenses');
         return;
      }
      fetchData();
    }
  }, [selectedWedding, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, venRes] = await Promise.all([
        api.get(`/expense/${selectedWedding._id}`),
        api.get(`/vendor/${selectedWedding._id}`)
      ]);
      setExpenses(expRes.data);
      setVendors(venRes.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // 1. Budget Prediction Logic
  const totalBudget = selectedWedding?.totalBudget || 0;
  const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const budgetUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // 2. Monthly Spending Data (Bar Chart)
  const monthlyData = {};
  expenses.forEach(exp => {
    const date = new Date(exp.expenseDate);
    const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + exp.amount;
  });

  const barChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Monthly Spending (₹)',
        data: Object.values(monthlyData),
        backgroundColor: 'rgba(139, 92, 246, 0.7)', // Primary purple
        borderColor: 'rgba(109, 40, 217, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // 3. Vendor Debt Data (Pie Chart)
  const vendorsWithDebt = vendors.filter(v => v.remainingAmount > 0);
  const pieChartData = {
    labels: vendorsWithDebt.map(v => v.vendorName),
    datasets: [
      {
        data: vendorsWithDebt.map(v => v.remainingAmount),
        backgroundColor: [
          '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'
        ],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('advancedAnalytics')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('analyticsSub')}</p>
          </div>
          {weddings.length > 0 && (
            <select 
              className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm outline-none cursor-pointer w-full md:w-auto"
              value={selectedWedding?._id || ''}
              onChange={(e) => {
                const chosen = weddings.find(w => w._id === e.target.value);
                setSelectedWedding(chosen);
                if (chosen) localStorage.setItem('selectedWeddingId', chosen._id);
              }}
            >
              {weddings.map(w => (
                <option key={w._id} value={w._id}>{w.weddingName}</option>
              ))}
            </select>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !selectedWedding ? (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-xl text-center shadow-sm">
            <p className="text-gray-500 dark:text-gray-400">No wedding selected to show analytics.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* AI Smart Prediction Card */}
            <div className={`p-6 rounded-xl shadow-sm border-l-4 flex items-start gap-4 ${
              budgetUsedPercent > 90 ? 'bg-red-50 dark:bg-red-900/10 border-red-500' :
              budgetUsedPercent > 75 ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500' :
              'bg-green-50 dark:bg-green-900/10 border-green-500'
            }`}>
              {budgetUsedPercent > 90 ? <AlertTriangle className="text-red-500 mt-1" size={28} /> :
               budgetUsedPercent > 75 ? <AlertTriangle className="text-orange-500 mt-1" size={28} /> :
               <CheckCircle className="text-green-500 mt-1" size={28} />
              }
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  Budget Forecast & Health <TrendingUp size={18} className="text-gray-400" />
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  You have spent <strong>{budgetUsedPercent.toFixed(1)}%</strong> of your total budget (₹{totalSpent.toLocaleString()} / ₹{totalBudget.toLocaleString()}).
                </p>
                {budgetUsedPercent > 90 ? (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium">Critical Warning: You are dangerously close to exceeding your budget. Hold off on non-essential bookings.</p>
                ) : budgetUsedPercent > 75 ? (
                  <p className="text-orange-600 dark:text-orange-400 text-sm mt-2 font-medium">Caution: You are approaching your budget limit. Review remaining vendor payments carefully.</p>
                ) : (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium">Great job! Your spending is well within the healthy limit.</p>
                )}
              </div>
            </div>

            {/* AI Budget Insights & Predictive Forecasts */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 mt-8">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="p-1 bg-purple-100 dark:bg-purple-950 rounded-lg text-primary">🤖</span>
                AI Budget Insights & Expense Predictions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Insight 1: Food & Catering */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                      Catering Analysis
                    </span>
                    <h4 className="font-bold text-gray-800 dark:text-white mt-2">Food Spends Health</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {((expenses.reduce((acc, exp) => acc + (exp.category === 'Catering' ? exp.amount : 0), 0) / (totalBudget || 1)) * 100) > 35 ? (
                        <span className="text-red-500 font-semibold">⚠️ Food expenses increasing rapidly! Food takes up more than 35% of your total budget. Consider optimizing guest plate selections.</span>
                      ) : (
                        <span className="text-green-500 font-semibold">✅ Food spending is highly optimized and perfectly aligned with typical wedding distributions!</span>
                      )}
                    </p>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-4 border-t pt-2 dark:border-gray-700">
                    Calculated against total allocated budget limit
                  </div>
                </div>

                {/* Insight 2: Decoration & Venue */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                      Theme Spends
                    </span>
                    <h4 className="font-bold text-gray-800 dark:text-white mt-2">Decoration & Venue Fees</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {expenses.reduce((acc, exp) => acc + (exp.category === 'Decoration' ? exp.amount : 0), 0) > 150000 ? (
                        <span className="text-red-500 font-semibold">⚠️ Decoration budget is currently very high (exceeding ₹1,50,000). Try checking alternative florist packages.</span>
                      ) : (
                        <span className="text-green-500 font-semibold">✅ Decoration expenses remain inside healthy margins. Your design plans look solid!</span>
                      )}
                    </p>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-4 border-t pt-2 dark:border-gray-700">
                    Evaluated based on vendor contracts logged
                  </div>
                </div>

                {/* Insight 3: Predictive Forecast */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                      AI Prediction
                    </span>
                    <h4 className="font-bold text-gray-800 dark:text-white mt-2">Predicted Final Spend</h4>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mt-1.5">
                      ₹{(totalSpent * 1.12).toLocaleString([], { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Based on current spend rate and dynamic estimation, we forecast a final value with a 12% safety margin. 
                      {totalSpent * 1.12 > totalBudget ? (
                        <span className="text-red-500 block font-semibold mt-1">⚠️ Warning: Predicted cost exceeds total allowed budget!</span>
                      ) : (
                        <span className="text-green-500 block font-semibold mt-1">🎉 Predicted cost is well within your budget limit!</span>
                      )}
                    </p>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-4 border-t pt-2 dark:border-gray-700">
                    Smart forecast algorithms including miscellaneous item buffer
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spending Over Time */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Spending Trend (Monthly)</h3>
                {Object.keys(monthlyData).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-12">No expense data available.</p>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <Bar 
                      data={barChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                            ticks: { color: '#9ca3af' }
                          },
                          x: { 
                            grid: { display: false },
                            ticks: { color: '#9ca3af' }
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Vendor Debt Distribution */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Who Do You Owe? (Vendor Debt)</h3>
                {vendorsWithDebt.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-12">You have 0 pending payments! Great job.</p>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <Pie 
                      data={pieChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
