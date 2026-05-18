import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';
import { Trash2, Download, Plus, Edit2, CreditCard, History } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import AddVendorForm from '../components/AddVendorForm';
import EditVendorModal from '../components/EditVendorModal';
import PayExpenseModal from '../components/PayExpenseModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { demoWedding, demoVendors } from '../utils/demoData';

const VendorManagement = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [vendors, setVendors] = useState([]);

  // Auth Modal states for Guest/Demo Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('');
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [payingExpense, setPayingExpense] = useState(null);

  useEffect(() => {
    if (!user) {
      // Instantly load mock wedding data if no user is signed in
      setWeddings([demoWedding]);
      setSelectedWedding(demoWedding);
      setVendors(demoVendors);
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
      // Contributors can now access this page, filtering is handled by backend

      fetchVendors();
    }
  }, [selectedWedding, user]);

  const fetchVendors = async () => {
    try {
      const { data } = await api.get(`/vendor/${selectedWedding._id}`);
      setVendors(data);
    } catch (error) {
      toast.error('Failed to load vendors');
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      setAuthActionName('delete vendors');
      setIsAuthModalOpen(true);
      return;
    }
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendor/delete/${id}`);
        setVendors(vendors.filter(v => v._id !== id));
        toast.success('Vendor deleted successfully');
      } catch (error) {
        toast.error('Failed to delete vendor');
      }
    }
  };

  const handleVendorAdded = (newVendor) => {
    setIsVendorModalOpen(false);
    setVendors([newVendor, ...vendors]);
    toast.success('Vendor added successfully!');
  };

  const handlePayVendorClick = async (vendor) => {
    if (!user) {
      setAuthActionName('pay vendors');
      setIsAuthModalOpen(true);
      return;
    }
    try {
      // 1. Fetch all expenses for this wedding
      const { data: expenses } = await api.get(`/expense/${selectedWedding._id}`);
      
      // 2. Look for a pending/partial expense that belongs to this vendor
      let matched = expenses.find(e => 
        e.vendor && e.vendor.toLowerCase().trim() === vendor.vendorName.toLowerCase().trim() && e.paymentStatus !== 'Paid'
      );
      
      if (matched) {
        setPayingExpense(matched);
      } else {
        // Look if there's any paid expense to view history
        const paidExpense = expenses.find(e => 
          e.vendor && e.vendor.toLowerCase().trim() === vendor.vendorName.toLowerCase().trim()
        );
        if (paidExpense) {
          setPayingExpense(paidExpense);
        } else {
          // No expense exists! Create a new tracking pending/partial expense automatically
          const { data: newExpense } = await api.post('/expense/add', {
            weddingId: vendor.weddingId,
            category: vendor.serviceType || 'Other',
            amount: vendor.totalAmount,
            vendor: vendor.vendorName,
            paymentStatus: vendor.advancePaid > 0 ? 'Partial' : 'Pending',
            paidAmount: vendor.advancePaid || 0,
            paymentMethod: 'UPI',
            expenseDate: new Date(),
            note: `Auto-generated tracking expense for registered vendor`
          });
          setPayingExpense(newExpense);
        }
      }
    } catch (err) {
      toast.error('Failed to prepare payment process');
      console.error(err);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Vendor Report - ${selectedWedding?.weddingName || 'Wedding'}`, 14, 15);
    
    const tableColumn = ["Vendor Name", "Service", "Contact", "Occasion Date", "Total Amount", "Advance", "Pending"];
    const tableRows = [];

    vendors.forEach(v => {
      const vData = [
        v.vendorName,
        v.serviceType,
        v.contactNumber || '-',
        v.occasionDate ? new Date(v.occasionDate).toLocaleDateString([], { dateStyle: 'medium' }) : 'Not Scheduled',
        `Rs. ${v.totalAmount}`,
        `Rs. ${v.advancePaid}`,
        `Rs. ${v.remainingAmount}`
      ];
      tableRows.push(vData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save(`${selectedWedding?.weddingName || 'Wedding'}_Vendors.pdf`);
    toast.success('PDF Downloaded');
  };

  const exportToExcel = () => {
    const dataForExcel = vendors.map(v => ({
      Vendor_Name: v.vendorName,
      Service: v.serviceType,
      Contact: v.contactNumber,
      Occasion_Date: v.occasionDate ? new Date(v.occasionDate).toLocaleDateString([], { dateStyle: 'medium' }) : 'Not Scheduled',
      Total_Amount: v.totalAmount,
      Advance_Paid: v.advancePaid,
      Pending_Balance: v.remainingAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
    XLSX.writeFile(workbook, `${selectedWedding?.weddingName || 'Wedding'}_Vendors.xlsx`);
    toast.success('Excel Downloaded');
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('vendorManagement')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('manageVendors')}</p>
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
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4 mb-6">
              <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400 font-medium">
                {vendors.length} Vendors Listed
              </div>
              <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                <div className="flex gap-2 flex-1 md:flex-none">
                  <button onClick={exportToPDF} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium cursor-pointer text-sm">
                    <Download size={16}/> PDF
                  </button>
                  <button onClick={exportToExcel} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium cursor-pointer text-sm">
                    <Download size={16}/> Excel
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (!user) {
                      setAuthActionName('add a vendor');
                      setIsAuthModalOpen(true);
                    } else {
                      setIsVendorModalOpen(true);
                    }
                  }} 
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-800 transition font-medium cursor-pointer text-sm"
                >
                  <Plus size={16}/> Add Vendor
                </button>
              </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-3 font-medium">{t('vendor')}</th>
                    <th className="p-3 font-medium">{t('serviceType')}</th>
                    <th className="p-3 font-medium">{t('contactNumber')}</th>
                    <th className="p-3 font-medium">Occasion Date</th>
                    <th className="p-3 font-medium text-center">Added By</th>
                    <th className="p-3 font-medium text-right">{t('amount')}</th>
                    <th className="p-3 font-medium text-right">{t('advancePaid')}</th>
                    <th className="p-3 font-medium text-right">{t('pendingBalance')}</th>
                    <th className="p-3 font-medium text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">No vendors found for this wedding.</td>
                    </tr>
                  ) : (
                    vendors.map(v => (
                      <tr key={v._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{v.vendorName}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{v.serviceType}</td>
                        <td className="p-3 text-sm dark:text-gray-300">
                          {v.contactNumber ? (
                            <a href={`tel:${v.contactNumber}`} className="text-primary hover:underline font-mono">{v.contactNumber}</a>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {v.occasionDate ? new Date(v.occasionDate).toLocaleDateString([], { dateStyle: 'medium' }) : <span className="text-gray-400 font-normal">Not Scheduled</span>}
                        </td>
                        <td className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {v.addedBy?.name || 'Owner'}
                        </td>
                        <td className="p-3 text-right font-medium dark:text-gray-200">₹{v.totalAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">₹{v.advancePaid.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-red-500 dark:text-red-400">
                          {v.remainingAmount > 0 ? `₹${v.remainingAmount.toLocaleString()}` : <span className="text-green-500 text-sm font-medium">Settled</span>}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            {v.remainingAmount > 0 ? (
                              <button 
                                onClick={() => handlePayVendorClick(v)}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                title="Pay Vendor"
                              >
                                <CreditCard size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handlePayVendorClick(v)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                                title="View Payment History"
                              >
                                <History size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => setEditingVendor(v)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title="Edit Vendor"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(v._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Delete Vendor"
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
              {vendors.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No vendors found for this wedding.</div>
              ) : (
                vendors.map(v => (
                  <div key={v._id} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border dark:border-gray-800 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{v.vendorName}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{v.serviceType} • Added by {v.addedBy?.name || 'Owner'}</p>
                        {v.occasionDate && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                            📅 Occasion: {new Date(v.occasionDate).toLocaleDateString([], { dateStyle: 'medium' })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {v.remainingAmount > 0 ? (
                          <button 
                            onClick={() => handlePayVendorClick(v)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition cursor-pointer"
                            title="Pay Vendor"
                          >
                            <CreditCard size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePayVendorClick(v)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition cursor-pointer"
                            title="View Payment History"
                          >
                            <History size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditingVendor(v)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {v.contactNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{t('phone')}:</span>
                        <a href={`tel:${v.contactNumber}`} className="text-primary hover:underline font-mono">{v.contactNumber}</a>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t dark:border-gray-800/60 text-center">
                      <div className="bg-white dark:bg-gray-900/60 p-2 rounded-lg border dark:border-gray-800/60">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('amount')}</p>
                        <p className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">₹{v.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/60 p-2 rounded-lg border dark:border-gray-800/60">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('advancePaid')}</p>
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-0.5">₹{v.advancePaid.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/60 p-2 rounded-lg border dark:border-gray-800/60">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Balance</p>
                        <p className={`text-xs font-bold mt-0.5 ${v.remainingAmount > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500'}`}>
                          {v.remainingAmount > 0 ? `₹${v.remainingAmount.toLocaleString()}` : 'Settled'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Add Vendor">
        <AddVendorForm weddingId={selectedWedding?._id} onSuccess={handleVendorAdded} />
      </Modal>

      {isAuthModalOpen && (
        <AuthRequiredModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          actionName={authActionName} 
        />
      )}

      {editingVendor && (
        <EditVendorModal 
          vendor={editingVendor} 
          onClose={() => setEditingVendor(null)} 
          onUpdate={(updatedVendor) => {
            setVendors(vendors.map(v => v._id === updatedVendor._id ? updatedVendor : v));
          }} 
        />
      )}

      {payingExpense && (
        <PayExpenseModal 
          expense={payingExpense} 
          onClose={() => setPayingExpense(null)} 
          onSuccess={() => {
            fetchVendors();
          }} 
        />
      )}
    </div>
  );
};

export default VendorManagement;
