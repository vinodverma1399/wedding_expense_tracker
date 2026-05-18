import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import CreateWeddingForm from '../components/CreateWeddingForm';
import AddExpenseForm from '../components/AddExpenseForm';
import AddVendorForm from '../components/AddVendorForm';
import InviteMemberModal from '../components/InviteMemberModal';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { Plus, Users } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { useTranslation } from 'react-i18next';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Modal states
  const [isWeddingModalOpen, setIsWeddingModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const { data } = await api.get('/wedding/all');
      setWeddings(data);
      if (data.length > 0 && !selectedWedding) {
        setSelectedWedding(data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load weddings');
    }
  };

  useEffect(() => {
    if (selectedWedding) {
      const fetchWeddingDetails = async () => {
        try {
          const [expensesRes, vendorsRes] = await Promise.all([
            api.get(`/expense/${selectedWedding._id}`),
            api.get(`/vendor/${selectedWedding._id}`)
          ]);
          setExpenses(expensesRes.data);
          setVendors(vendorsRes.data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to load wedding details');
        }
      };
      fetchWeddingDetails();

      // Connect to Socket.IO for real-time collaboration
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      socket.emit('joinWedding', selectedWedding._id);

      socket.on('expenseAdded', (newExpense) => {
        setExpenses(prev => {
          // Avoid duplicate entries if this client added it
          if (prev.some(e => e._id === newExpense._id)) return prev;
          return [newExpense, ...prev];
        });
        toast.info(`🔔 New expense of ₹${newExpense.amount.toLocaleString()} added by ${newExpense.addedBy?.name || 'a team member'}!`);
      });

      return () => {
        socket.emit('leaveWedding', selectedWedding._id);
        socket.disconnect();
      };
    }
  }, [selectedWedding]);

  const handleWeddingCreated = (newWedding) => {
    setIsWeddingModalOpen(false);
    toast.success('Wedding created successfully!');
    setWeddings([...weddings, newWedding]);
    setSelectedWedding(newWedding);
  };

  const handleDeleteWedding = async () => {
    if (!selectedWedding) return;
    if (window.confirm(`Are you sure you want to completely delete "${selectedWedding.weddingName}" and all of its expenses and vendors? This action cannot be undone.`)) {
      try {
        await api.delete(`/wedding/delete/${selectedWedding._id}`);
        toast.success('Wedding deleted successfully');
        const updatedWeddings = weddings.filter(w => w._id !== selectedWedding._id);
        setWeddings(updatedWeddings);
        setSelectedWedding(updatedWeddings.length > 0 ? updatedWeddings[0] : null);
      } catch (error) {
        toast.error('Failed to delete wedding');
      }
    }
  };

  const handleExpenseAdded = (newExpense) => {
    setIsExpenseModalOpen(false);
    setExpenses([newExpense, ...expenses]);
    toast.success('Expense added successfully!');
  };

  const handleVendorAdded = (newVendor) => {
    setIsVendorModalOpen(false);
    setVendors([newVendor, ...vendors]);
    toast.success('Vendor added successfully!');
  };

  // Calculate stats
  const totalBudget = selectedWedding?.totalBudget || 0;
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const pendingPayments = vendors.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  // Prepare Chart Data
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#6d28d9', '#db2777', '#f59e0b', '#10b981', '#3b82f6', 
          '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#eab308'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome, {user?.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your wedding expenses efficiently.</p>
          </div>
          <div className="flex gap-4 items-center">
            <NotificationBell selectedWedding={selectedWedding} />
            {weddings.length > 0 && (
              <div className="flex gap-2 items-center">
                <select 
                  className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm outline-none cursor-pointer"
                  value={selectedWedding?._id || ''}
                  onChange={(e) => setSelectedWedding(weddings.find(w => w._id === e.target.value))}
                >
                  {weddings.map(w => (
                    <option key={w._id} value={w._id}>{w.weddingName}</option>
                  ))}
                </select>
                <button 
                  onClick={handleDeleteWedding}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title="Delete Selected Wedding"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            )}
            {selectedWedding && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition shadow-sm font-medium flex items-center gap-1">
                <Users size={18}/> Invite
              </button>
            )}
            <button 
              onClick={() => setIsWeddingModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition shadow-sm font-medium flex items-center gap-1">
              <Plus size={18}/> New Wedding
            </button>
          </div>
        </header>

        {weddings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-xl shadow-sm text-center border border-dashed border-gray-300 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">No weddings found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Get started by creating your first wedding dashboard to track expenses, manage vendors, and monitor your budget.</p>
            <button 
              onClick={() => setIsWeddingModalOpen(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-purple-800 transition font-medium shadow-md">
              Create First Wedding
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-primary transition hover:shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('totalBudget')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-red-500 transition hover:shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('totalSpent')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-green-500 transition hover:shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('remaining')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{remainingBudget.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-orange-500 transition hover:shadow-md">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('pending')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{pendingPayments.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('recentExpenses')}</h3>
                  <button onClick={() => setIsExpenseModalOpen(true)} className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md flex items-center gap-1 transition">
                    <Plus size={16}/> {t('addExpense')}
                  </button>
                </div>
                {expenses.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-8">No expenses added yet.</p> : (
                  <div className="space-y-4">
                    {expenses.slice(0, 5).map(exp => (
                      <div key={exp._id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-primary font-bold">
                            {exp.category.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{t(exp.category.toLowerCase()) || exp.category} {exp.vendor && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({exp.vendor})</span>}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()} • {t(exp.paymentMethod.toLowerCase()) || exp.paymentMethod} • Added by {exp.addedBy?.name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800 dark:text-white">₹{exp.amount.toLocaleString()}</p>
                          <p className={`text-xs font-medium ${exp.paymentStatus === 'Paid' ? 'text-green-500 dark:text-green-400' : exp.paymentStatus === 'Pending' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}>
                            {t(exp.paymentStatus.toLowerCase()) || exp.paymentStatus}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm flex flex-col items-center">
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white w-full">{t('expenseBreakdown')}</h3>
                {expenses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">No data to display.</p>
                ) : (
                  <div className="w-full max-w-[250px] aspect-square">
                    <Doughnut data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, color: '#9ca3af' } } } }} />
                  </div>
                )}
                
                <div className="w-full mt-6 pt-6 border-t dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300 mb-3">{t('teamMembers')} ({1 + (selectedWedding.members?.length || 0)})</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">
                      {selectedWedding.userId?.name || 'Owner'} (Admin)
                    </span>
                    {selectedWedding.members?.map(m => (
                      <span key={m._id} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        {m.user?.name || 'Member'} ({m.role})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('vendors')}</h3>
                <button onClick={() => setIsVendorModalOpen(true)} className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md flex items-center gap-1 transition">
                  <Plus size={16}/> {t('addVendor')}
                </button>
              </div>
              {vendors.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-8">No vendors added yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                        <th className="p-3 font-medium">Vendor Name</th>
                        <th className="p-3 font-medium">Service</th>
                        <th className="p-3 font-medium">Contact</th>
                        <th className="p-3 font-medium text-right">Total Amount</th>
                        <th className="p-3 font-medium text-right">Advance Paid</th>
                        <th className="p-3 font-medium text-right">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(v => (
                        <tr key={v._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <td className="p-3 font-medium dark:text-gray-200">{v.vendorName}</td>
                          <td className="p-3 text-sm text-gray-500 dark:text-gray-400">{v.serviceType}</td>
                          <td className="p-3 text-sm dark:text-gray-300">{v.contactNumber}</td>
                          <td className="p-3 text-right dark:text-white">₹{v.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-right text-green-600 dark:text-green-400">₹{v.advancePaid.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-red-500 dark:text-red-400">₹{v.remainingAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Premium Live Activity Timeline */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm mt-8 border dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                Live Activity Timeline & Audit Trail
              </h3>
              
              {expenses.length === 0 && vendors.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activities logged yet.</p>
              ) : (
                <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
                  {([
                    ...expenses.map(e => ({
                      id: e._id,
                      type: 'expense',
                      title: `Expense added: ${e.category}`,
                      detail: `₹${e.amount.toLocaleString()} - Payment status: ${e.paymentStatus}`,
                      user: e.addedBy?.name || 'Owner',
                      time: new Date(e.createdAt || e.expenseDate)
                    })),
                    ...vendors.map(v => ({
                      id: v._id,
                      type: 'vendor',
                      title: `New Vendor added: ${v.vendorName}`,
                      detail: `Booked for ${v.serviceType} with a remaining budget of ₹${v.remainingAmount.toLocaleString()}`,
                      user: selectedWedding?.userId?.name || 'Owner',
                      time: new Date(v.createdAt)
                    }))
                  ].sort((a, b) => b.time - a.time).slice(0, 5)).map(act => (
                    <div key={act.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        act.type === 'expense' ? 'bg-purple-500' : 'bg-green-500'
                      }`}></span>
                      
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                        <div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{act.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.detail}</p>
                        </div>
                        <div className="text-left md:text-right mt-1 md:mt-0">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                            {act.user}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.time.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Modal isOpen={isWeddingModalOpen} onClose={() => setIsWeddingModalOpen(false)} title="Create New Wedding">
          <CreateWeddingForm onSuccess={handleWeddingCreated} />
        </Modal>

        <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Expense">
          <AddExpenseForm weddingId={selectedWedding?._id} onSuccess={handleExpenseAdded} />
        </Modal>

        <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Add Vendor">
          <AddVendorForm weddingId={selectedWedding?._id} onSuccess={handleVendorAdded} />
        </Modal>

        <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Family Member">
          <InviteMemberModal weddingId={selectedWedding?._id} onClose={() => setIsInviteModalOpen(false)} />
        </Modal>

      </div>
    </div>
  );
};

export default Dashboard;
