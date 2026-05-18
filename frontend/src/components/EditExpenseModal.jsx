import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Cpu, FileText } from 'lucide-react';

const EditExpenseModal = ({ expense, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    category: expense.category,
    amount: expense.amount,
    vendor: expense.vendor || '',
    note: expense.note || '',
    paymentStatus: expense.paymentStatus,
    paymentMethod: expense.paymentMethod,
    expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
    billUrl: expense.billUrl || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const categories = ['Venue', 'Catering', 'Decoration', 'Photography', 'Jewellery', 'Travel', 'DJ', 'Makeup', 'Clothes', 'Gifts', 'Hotel', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadTesseract = () => {
    return new Promise((resolve) => {
      if (window.Tesseract) return resolve(window.Tesseract);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = () => resolve(window.Tesseract);
      document.body.appendChild(script);
    });
  };

  const performOCR = async (file) => {
    setOcrLoading(true);
    toast.info('🤖 AI Scanner: Parsing receipt details...', { autoClose: 2000 });
    try {
      const tesseract = await loadTesseract();
      const { data: { text } } = await tesseract.recognize(file, 'eng');
      
      // 1. Amount Auto-detection (Dual-Layered line-by-line + Regex Fallback)
      let detectedAmount = '';
      
      // Layer A: Line-by-line isolation to find the true TOTAL line
      const textLines = text.split('\n');
      for (const line of textLines) {
        const lowerLine = line.toLowerCase();
        if (
          (lowerLine.includes('total') || lowerLine.includes('grand') || lowerLine.includes('payable') || lowerLine.includes('net') || lowerLine.includes('paid')) &&
          !lowerLine.includes('subtotal') &&
          !lowerLine.includes('sub total') &&
          !lowerLine.includes('gst')
        ) {
          const numMatch = line.match(/([\d,]+(?:\.\d+)?)/);
          if (numMatch) {
            const cleanNum = numMatch[1].replace(/,/g, '');
            const parsedVal = Math.round(parseFloat(cleanNum));
            if (!isNaN(parsedVal) && parsedVal > 0) {
              detectedAmount = parsedVal.toString();
              break;
            }
          }
        }
      }

      // Layer B: Fallback to regex matching if no line-by-line match was established
      if (!detectedAmount) {
        const amountRegexes = [
          /\b(?:total|grand\s+total|net\s+payable|net\s+amount|grandtotal|total\s+amount|payable|total\s+due|rs\.?|inr|₹)\b\s*:?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/i,
          /([\d,]+(?:\.\d+)?)\s*\b(?:total|grand\s+total|net\s+payable)\b/i
        ];
        for (const regex of amountRegexes) {
          const match = text.match(regex);
          if (match && match[1]) {
            const cleanNum = match[1].replace(/,/g, '');
            detectedAmount = Math.round(parseFloat(cleanNum)).toString();
            break;
          }
        }
      }

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      let detectedVendor = '';
      if (lines.length > 0) {
        detectedVendor = lines[0].replace(/[^\w\s&.-]/g, '');
      }

      let detectedDate = '';
      const dateRegex1 = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/; // YYYY-MM-DD
      const dateRegex2 = /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/; // DD-MM-YYYY or MM-DD-YYYY
      const dateRegex3 = /(\d{1,2})[-/](\d{1,2})[-/](\d{2})/;   // DD-MM-YY or MM-DD-YY

      const match1 = text.match(dateRegex1);
      const match2 = text.match(dateRegex2);
      const match3 = text.match(dateRegex3);

      if (match1) {
        let [_, y, m, d] = match1;
        if (parseInt(m) <= 12 && parseInt(d) <= 31) {
          detectedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      } else if (match2) {
        let [_, d, m, y] = match2;
        if (parseInt(m) <= 12 && parseInt(d) <= 31) {
          detectedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else if (parseInt(d) <= 12 && parseInt(m) <= 31) {
          detectedDate = `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`;
        }
      } else if (match3) {
        let [_, d, m, y] = match3;
        let fullYear = '20' + y;
        if (parseInt(m) <= 12 && parseInt(d) <= 31) {
          detectedDate = `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else if (parseInt(d) <= 12 && parseInt(m) <= 31) {
          detectedDate = `${fullYear}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`;
        }
      }

      let detectedCategory = 'Other';
      const catKeywords = {
        Venue: ['hotel', 'hall', 'lawn', 'garden', 'resort', 'palace', 'venue', 'banquet'],
        Catering: ['food', 'catering', 'caterer', 'lunch', 'dinner', 'sweets', 'menu', 'plate', 'buffet'],
        Decoration: ['flower', 'decor', 'tent', 'stage', 'light', 'sound', 'mandap'],
        Photography: ['photo', 'studio', 'video', 'lens', 'cinematography', 'photography', 'shoot'],
        Jewellery: ['gold', 'jewel', 'silver', 'diamond', 'ring', 'necklace'],
        Travel: ['cab', 'taxi', 'travel', 'bus', 'flight', 'car', 'fuel', 'ticket'],
        DJ: ['dj', 'music', 'sound system', 'band', 'dholl', 'dhol'],
        Makeup: ['salon', 'parlour', 'makeup', 'grooming', 'mehendi art', 'artist'],
        Clothes: ['sherwani', 'saree', 'lehenga', 'suit', 'boutique', 'garment', 'clothes'],
        Gifts: ['gift', 'cards', 'box', 'envelope', 'invitation', 'card'],
        Hotel: ['stay', 'room', 'accommodation', 'bed']
      };

      for (const [cat, keywords] of Object.entries(catKeywords)) {
        if (keywords.some(k => text.toLowerCase().includes(k))) {
          detectedCategory = cat;
          break;
        }
      }

      setFormData(prev => ({
        ...prev,
        amount: detectedAmount || prev.amount,
        vendor: detectedVendor || prev.vendor,
        category: detectedCategory || prev.category,
        expenseDate: detectedDate || prev.expenseDate,
        note: `AI OCR Scanned: ${detectedVendor || 'Vendor'}`
      }));

      toast.success(`🤖 AI OCR: Auto-filled Amount: ₹${detectedAmount || 'Not found'}, Vendor: ${detectedVendor || 'Not found'}, Category: ${detectedCategory}`);

    } catch (err) {
      console.error(err);
      toast.warning('⚠️ AI Scanner was unable to fully parse details.');
    } finally {
      setOcrLoading(false);
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    performOCR(file);

    const formDataObj = new FormData();
    formDataObj.append('bill', file);
    setUploading(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await api.post('/upload', formDataObj, config);
      setFormData(prev => ({ ...prev, billUrl: data.url }));
      setUploading(false);
    } catch (error) {
      toast.error('File upload failed');
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/expense/update/${expense._id}`, formData);
      onUpdate(data);
      toast.success('Expense updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update expense');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="1"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Person (Optional)</label>
              <input type="text" name="vendor" value={formData.vendor} onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="expenseDate" value={formData.expenseDate} onChange={handleChange} required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Cpu size={16} className="text-purple-600 animate-pulse" />
                AI OCR Scanner & Receipt Attachment
              </label>
              <div className="border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl p-3 bg-purple-50/30 dark:bg-purple-950/10 hover:bg-purple-50/60 transition">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={uploadFileHandler} 
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/40 dark:file:text-purple-400 cursor-pointer"
                />
                {ocrLoading && (
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
                    <Cpu size={14} className="animate-spin" />
                    OCR Engine is parsing receipt text...
                  </div>
                )}
                {uploading && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    ☁️ Cloudinary: Uploading document copy...
                  </div>
                )}
                {formData.billUrl && !uploading && !ocrLoading && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">
                      <FileText size={14} />
                      Receipt attached!
                    </div>
                    <a 
                      href={formData.billUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      View Current Bill
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <textarea name="note" value={formData.note} onChange={handleChange} rows="2"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
          </div>
          <div className="pt-4">
            <button type="submit" disabled={loading || uploading} 
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
