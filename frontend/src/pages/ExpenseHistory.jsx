import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';
import { Trash2, Search, Filter, Download, Edit2, Plus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EditExpenseModal from '../components/EditExpenseModal';
import Modal from '../components/Modal';
import AddExpenseForm from '../components/AddExpenseForm';
import { useTranslation } from 'react-i18next';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { demoWedding, demoExpenses } from '../utils/demoData';
import PayExpenseModal from '../components/PayExpenseModal';

const ExpenseHistory = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('All Members');
  const [sortBy, setSortBy] = useState('date-desc');
  const [editingExpense, setEditingExpense] = useState(null);
  const [payingExpense, setPayingExpense] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['All', 'Venue', 'Catering', 'Decoration', 'Photography', 'Jewellery', 'Travel', 'DJ', 'Makeup', 'Clothes', 'Gifts', 'Hotel', 'Other'];

  // Auth Modal states for Guest/Demo Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      // Instantly load mock wedding data if no user is signed in
      setWeddings([demoWedding]);
      setSelectedWedding(demoWedding);
      setExpenses(demoExpenses);
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
      }
    } catch (error) {
      toast.error('Failed to load weddings');
    }
  };

  useEffect(() => {
    if (selectedWedding && user) {
      fetchExpenses();
    }
  }, [selectedWedding, user]);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/expense/${selectedWedding._id}`);
      setExpenses(data);
    } catch (error) {
      toast.error('Failed to load expenses');
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      setAuthActionName('delete expenses');
      setIsAuthModalOpen(true);
      return;
    }
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expense/delete/${id}`);
        setExpenses(expenses.filter(e => e._id !== id));
        toast.success('Expense deleted successfully');
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleUpdateExpense = (updatedExp) => {
    setExpenses(expenses.map(e => e._id === updatedExp._id ? updatedExp : e));
  };

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, memberFilter, sortBy]);

  const uniqueMembers = ['All Members', ...new Set(expenses.map(e => e.paidBy || 'Self'))];

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.vendor && exp.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter && categoryFilter !== 'All' ? exp.category === categoryFilter : true;
    const memberName = exp.paidBy || 'Self';
    const matchesMember = memberFilter !== 'All Members' ? memberName === memberFilter : true;
    return matchesSearch && matchesCategory && matchesMember;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') {
      const dateDiff = new Date(b.expenseDate) - new Date(a.expenseDate);
      return dateDiff !== 0 ? dateDiff : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'date-asc') {
      const dateDiff = new Date(a.expenseDate) - new Date(b.expenseDate);
      return dateDiff !== 0 ? dateDiff : new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handleExpenseAdded = (newExpense) => {
    setIsExpenseModalOpen(false);
    setExpenses([newExpense, ...expenses]);
    toast.success('Expense added successfully!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Expense Report - ${selectedWedding?.weddingName || 'Wedding'}`, 14, 15);
    
    const tableColumn = ["Date", "Category", "Vendor", "Payment Method", "Status", "Paid By", "Amount"];
    const tableRows = [];

    filteredExpenses.forEach(exp => {
      const expData = [
        new Date(exp.expenseDate).toLocaleDateString(),
        exp.category,
        exp.vendor || '-',
        exp.paymentMethod,
        exp.paymentStatus,
        exp.paidBy || 'Self',
        `Rs. ${exp.amount}`
      ];
      tableRows.push(expData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save(`${selectedWedding?.weddingName || 'Wedding'}_Expenses.pdf`);
    toast.success('PDF Downloaded');
  };

  const exportToExcel = () => {
    const dataForExcel = filteredExpenses.map(exp => ({
      Date: new Date(exp.expenseDate).toLocaleDateString(),
      Category: exp.category,
      Vendor: exp.vendor || '-',
      Payment_Method: exp.paymentMethod,
      Status: exp.paymentStatus,
      Paid_By: exp.paidBy || 'Self',
      Amount: exp.amount,
      Note: exp.note || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `${selectedWedding?.weddingName || 'Wedding'}_Expenses.xlsx`);
    toast.success('Excel Downloaded');
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('expenseHistory')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('viewManageExpenses')}</p>
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

        {selectedWedding && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 mb-8">
            <div className="flex justify-between items-end mb-4">
              <div className="hidden md:block">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Filtered Amount:</span>
                <span className="ml-2 text-2xl font-bold text-primary dark:text-purple-400">₹{totalFilteredAmount.toLocaleString()}</span>
              </div>
            </div>
            {/* Mobile Total Highlight */}
            <div className="mb-4 text-left md:hidden p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Displayed:</span>
              <span className="text-lg font-bold text-primary dark:text-purple-400">₹{totalFilteredAmount.toLocaleString()}</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <div className="relative flex-1 min-w-[140px]">
                  <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <select 
                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : t(c.toLowerCase()) || c}</option>)}
                  </select>
                </div>
                <div className="relative flex-1 min-w-[140px]">
                  <select 
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white"
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                  >
                    {uniqueMembers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="relative flex-1 min-w-[160px]">
                  <select 
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white font-medium"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Amount: High to Low</option>
                    <option value="amount-asc">Amount: Low to High</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                <div className="flex gap-2 flex-1 md:flex-none">
                  <button onClick={exportToPDF} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium cursor-pointer">
                    <Download size={18}/> PDF
                  </button>
                  <button onClick={exportToExcel} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium cursor-pointer">
                    <Download size={18}/> Excel
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (!user) {
                      setAuthActionName('add an expense');
                      setIsAuthModalOpen(true);
                    } else {
                      setIsExpenseModalOpen(true);
                    }
                  }} 
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-800 transition font-medium cursor-pointer"
                >
                  <Plus size={18}/> Add Expense
                </button>
              </div>
            </div>

            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-3 font-medium">{t('date')}</th>
                    <th className="p-3 font-medium">{t('category')}</th>
                    <th className="p-3 font-medium">{t('vendor')}</th>
                    <th className="p-3 font-medium">{t('paymentMethod')} / {t('paymentStatus')}</th>
                    <th className="p-3 font-medium">Paid By</th>
                    <th className="p-3 font-medium text-right">{t('amount')}</th>
                    <th className="p-3 font-medium text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">No expenses found matching your criteria.</td>
                    </tr>
                  ) : (
                    paginatedExpenses.map(exp => (
                      <tr key={exp._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="p-3 text-sm dark:text-gray-300">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{t(exp.category.toLowerCase()) || exp.category}</td>
                        <td className="p-3">
                          <div className="text-sm font-medium dark:text-gray-200">{exp.vendor || '-'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{exp.note}</div>
                          {exp.billUrl && (
                            <a href={exp.billUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline mt-1 inline-block font-medium">
                              View Bill
                            </a>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                            exp.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            exp.paymentStatus === 'Pending' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {t(exp.paymentStatus.toLowerCase()) || exp.paymentStatus}
                          </span>
                          {exp.paymentStatus !== 'Pending' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t(exp.paymentMethod.toLowerCase()) || exp.paymentMethod}</div>
                          )}
                          {exp.paymentStatus === 'Partial' && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-tight">
                              <span className="text-green-600 dark:text-green-400 font-medium">Paid: ₹{(exp.paidAmount || 0).toLocaleString()}</span><br/>
                              <span className="text-red-500 dark:text-red-400 font-medium">Bal: ₹{(exp.remainingAmount || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                          {exp.paidBy || 'Self'}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-800 dark:text-white">₹{exp.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(exp.paymentStatus === 'Pending' || exp.paymentStatus === 'Partial') ? (
                              <button 
                                onClick={() => {
                                  if (!user) {
                                    setAuthActionName('record payments');
                                    setIsAuthModalOpen(true);
                                  } else {
                                    setPayingExpense(exp);
                                  }
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                                title="Record Payment"
                              >
                                Pay
                              </button>
                            ) : (
                              exp.paymentHistory && exp.paymentHistory.length > 0 && (
                                <button 
                                  onClick={() => setPayingExpense(exp)}
                                  className="px-2 py-1 text-xs font-semibold border border-purple-200 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition cursor-pointer flex items-center gap-1"
                                  title="View Payment History"
                                >
                                  History
                                </button>
                              )
                            )}
                            <button 
                              onClick={() => {
                                if (!user) {
                                  setAuthActionName('edit expenses');
                                  setIsAuthModalOpen(true);
                                } else {
                                  setEditingExpense(exp);
                                }
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(exp._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-4">
              {paginatedExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No expenses found matching your criteria.</div>
              ) : (
                paginatedExpenses.map(exp => (
                  <div key={exp._id} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border dark:border-gray-800 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium bg-white dark:bg-gray-900 border dark:border-gray-800 px-2 py-0.5 rounded">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </span>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mt-1">
                          {t(exp.category.toLowerCase()) || exp.category}
                        </h4>
                      </div>
                      <p className="text-lg font-bold text-primary">₹{exp.amount.toLocaleString()}</p>
                    </div>

                    <div className="text-sm space-y-1 bg-white dark:bg-gray-900/60 p-2.5 rounded-lg border dark:border-gray-800/60">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{exp.vendor || '-'}</span>
                      </div>
                      {exp.note && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Note:</span>
                          <span className="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{exp.note}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              exp.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              exp.paymentStatus === 'Pending' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                              {t(exp.paymentStatus.toLowerCase()) || exp.paymentStatus}
                            </span>
                            {exp.paymentStatus !== 'Pending' && (
                              <span className="text-[10px] text-gray-400">• {t(exp.paymentMethod.toLowerCase()) || exp.paymentMethod}</span>
                            )}
                          </div>
                          {exp.paymentStatus === 'Partial' && (
                            <div className="text-[10px] flex gap-2 mt-0.5">
                              <span className="text-green-600 dark:text-green-400 font-medium">Paid: ₹{(exp.paidAmount || 0).toLocaleString()}</span>
                              <span className="text-red-500 dark:text-red-400 font-medium">Bal: ₹{(exp.remainingAmount || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div className="text-xs text-gray-400">
                        Paid by: <span className="font-medium text-gray-600 dark:text-gray-300">{exp.paidBy || 'Self'}</span>
                      </div>
                      <div className="flex gap-2">
                        {exp.billUrl && (
                          <a href={exp.billUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 text-xs text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition font-medium border border-primary/20">
                            Bill
                          </a>
                        )}
                        {(exp.paymentStatus === 'Pending' || exp.paymentStatus === 'Partial') ? (
                          <button 
                            onClick={() => {
                              if (!user) {
                                setAuthActionName('record payments');
                                setIsAuthModalOpen(true);
                              } else {
                                setPayingExpense(exp);
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Record Payment"
                          >
                            Pay
                          </button>
                        ) : (
                          exp.paymentHistory && exp.paymentHistory.length > 0 && (
                            <button 
                              onClick={() => setPayingExpense(exp)}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-purple-200 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition cursor-pointer flex items-center gap-1"
                              title="View Payment History"
                            >
                              History
                            </button>
                          )
                        )}
                        <button onClick={() => {
                          if (!user) {
                            setAuthActionName('edit expenses');
                            setIsAuthModalOpen(true);
                          } else {
                            setEditingExpense(exp);
                          }
                        }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition cursor-pointer"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(exp._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-3.5 py-1.5 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                        currentPage === i + 1
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-3.5 py-1.5 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingExpense && (
        <EditExpenseModal 
          expense={editingExpense} 
          onClose={() => setEditingExpense(null)} 
          onUpdate={handleUpdateExpense} 
        />
      )}

      {payingExpense && (
        <PayExpenseModal 
          expense={payingExpense} 
          onClose={() => setPayingExpense(null)} 
          onSuccess={handleUpdateExpense} 
        />
      )}

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Expense">
        <AddExpenseForm weddingId={selectedWedding?._id} onSuccess={handleExpenseAdded} />
      </Modal>

      <AuthRequiredModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        actionName={authActionName} 
      />
    </div>
  );
};

export default ExpenseHistory;
