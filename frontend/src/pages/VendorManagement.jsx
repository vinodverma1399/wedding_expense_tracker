import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';
import { Trash2, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { demoWedding, demoVendors } from '../utils/demoData';

const VendorManagement = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [vendors, setVendors] = useState([]);

  // Auth Modal states for Guest/Demo Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('');

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
        setSelectedWedding(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load weddings');
    }
  };

  useEffect(() => {
    if (selectedWedding && user) {
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Vendor Report - ${selectedWedding?.weddingName || 'Wedding'}`, 14, 15);
    
    const tableColumn = ["Vendor Name", "Service", "Contact", "Total Amount", "Advance", "Pending"];
    const tableRows = [];

    vendors.forEach(v => {
      const vData = [
        v.vendorName,
        v.serviceType,
        v.contactNumber,
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
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('vendorManagement')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('manageVendors')}</p>
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
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm">
                <Download size={16}/> PDF
              </button>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium text-sm">
                <Download size={16}/> Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="p-3 font-medium">{t('vendor')}</th>
                    <th className="p-3 font-medium">{t('serviceType')}</th>
                    <th className="p-3 font-medium">{t('contactNumber')}</th>
                    <th className="p-3 font-medium text-right">{t('amount')}</th>
                    <th className="p-3 font-medium text-right">{t('advancePaid')}</th>
                    <th className="p-3 font-medium text-right">{t('pendingBalance')}</th>
                    <th className="p-3 font-medium text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">No vendors found for this wedding.</td>
                    </tr>
                  ) : (
                    vendors.map(v => (
                      <tr key={v._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{v.vendorName}</td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{v.serviceType}</td>
                        <td className="p-3 text-sm dark:text-gray-300">{v.contactNumber}</td>
                        <td className="p-3 text-right font-medium dark:text-gray-200">₹{v.totalAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">₹{v.advancePaid.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-red-500 dark:text-red-400">
                          {v.remainingAmount > 0 ? `₹${v.remainingAmount.toLocaleString()}` : <span className="text-green-500 text-sm font-medium">Settled</span>}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleDelete(v._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete Vendor"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <AuthRequiredModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        actionName={authActionName} 
      />
    </div>
  );
};

export default VendorManagement;
