import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';
import { Trash2, Search, Filter, Download, Edit2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EditExpenseModal from '../components/EditExpenseModal';
import { useTranslation } from 'react-i18next';

const ExpenseHistory = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['All', 'Venue', 'Catering', 'Decoration', 'Photography', 'Jewellery', 'Travel', 'DJ', 'Makeup', 'Clothes', 'Gifts', 'Hotel', 'Other'];

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const { data } = await api.get('/wedding/all');
      setWeddings(data);
      if (data.length > 0) {
        setSelectedWedding(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load weddings');
    }
  };

  useEffect(() => {
    if (selectedWedding) {
      fetchExpenses();
    }
  }, [selectedWedding]);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/expense/${selectedWedding._id}`);
      setExpenses(data);
    } catch (error) {
      toast.error('Failed to load expenses');
    }
  };

  const handleDelete = async (id) => {
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
  }, [searchTerm, categoryFilter]);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.vendor && exp.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter && categoryFilter !== 'All' ? exp.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Expense Report - ${selectedWedding?.weddingName || 'Wedding'}`, 14, 15);
    
    const tableColumn = ["Date", "Category", "Vendor", "Payment Method", "Status", "Amount"];
    const tableRows = [];

    filteredExpenses.forEach(exp => {
      const expData = [
        new Date(exp.expenseDate).toLocaleDateString(),
        exp.category,
        exp.vendor || '-',
        exp.paymentMethod,
        exp.paymentStatus,
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
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('expenseHistory')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('viewManageExpenses')}</p>
          </div>
          {weddings.length > 0 && (
            <select 
              className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm outline-none cursor-pointer"
              value={selectedWedding?._id || ''}
              onChange={(e) => setSelectedWedding(weddings.find(w => w._id === e.target.value))}
            >
              {weddings.map(w => (
                <option key={w._id} value={w._id}>{w.weddingName}</option>
              ))}
            </select>
          )}
        </header>

        {selectedWedding && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 mb-8">
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
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select 
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white min-w-[150px]"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All' : t(c.toLowerCase()) || c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">
                  <Download size={18}/> PDF
                </button>
                <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium">
                  <Download size={18}/> Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-3 font-medium">{t('date')}</th>
                    <th className="p-3 font-medium">{t('category')}</th>
                    <th className="p-3 font-medium">{t('vendor')}</th>
                    <th className="p-3 font-medium">{t('paymentMethod')} / {t('paymentStatus')}</th>
                    <th className="p-3 font-medium">Added By</th>
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
                      <tr key={exp._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
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
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t(exp.paymentMethod.toLowerCase()) || exp.paymentMethod}</div>
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                          {exp.addedBy?.name || 'Unknown'}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-800 dark:text-white">₹{exp.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingExpense(exp)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Expense"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(exp._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
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
    </div>
  );
};

export default ExpenseHistory;
