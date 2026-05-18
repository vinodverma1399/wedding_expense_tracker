import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Cpu, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddExpenseForm = ({ weddingId, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    category: 'Venue',
    amount: '',
    vendor: '',
    note: '',
    paymentStatus: 'Paid',
    paidAmount: '',
    paymentMethod: 'Cash',
    expenseDate: new Date().toISOString().split('T')[0],
    billUrl: '',
    paidBy: user?.name || ''
  });
  const [saveAsVendor, setSaveAsVendor] = useState(false);
  const [vendorContact, setVendorContact] = useState('');
  const [vendorBookedPrice, setVendorBookedPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');

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
    toast.info('🤖 AI Scanner: Scanning receipt contents...', { autoClose: 2000 });
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

      // 2. Vendor Auto-detection (Look at the first line of the invoice)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      let detectedVendor = '';
      if (lines.length > 0) {
        detectedVendor = lines[0].replace(/[^\w\s&.-]/g, '');
      }

      // 3. Date Auto-detection (Robust Multi-Format Parsing)
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

      // 4. Category Keyword Mapping
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

      // Populate form
      setFormData(prev => ({
        ...prev,
        amount: detectedAmount || prev.amount,
        vendor: detectedVendor || prev.vendor,
        category: detectedCategory || prev.category,
        expenseDate: detectedDate || prev.expenseDate,
        note: `AI OCR Scanned: ${detectedVendor || 'Vendor'}`
      }));

      toast.success(`🤖 AI Scanner Loaded! Amount: ₹${detectedAmount || 'Not found'}, Vendor: ${detectedVendor || 'Not found'}, Category: ${detectedCategory}`);

    } catch (err) {
      console.error('OCR scanning failed:', err);
      toast.warning('⚠️ AI Scanner was unable to fully parse the receipt details.');
    } finally {
      setOcrLoading(false);
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Run AI OCR in background
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
      console.error(error);
      setUploading(false);
      setError('File upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        paymentMethod: formData.paymentStatus === 'Pending' ? 'Other' : formData.paymentMethod,
        weddingId
      };
      const { data } = await api.post('/expense/add', payload);
      
      // If saveAsVendor is checked, automatically create a vendor directory contact in the background
      if (saveAsVendor && formData.vendor) {
        try {
          await api.post('/vendor/add', {
            weddingId,
            vendorName: formData.vendor,
            serviceType: formData.category,
            totalAmount: Number(vendorBookedPrice) || Number(formData.amount) || 0,
            advancePaid: Number(formData.paidAmount) || (formData.paymentStatus === 'Paid' ? Number(formData.amount) : 0),
            contactNumber: vendorContact || ''
          });
          toast.success('🤖 Vendor directory contact registered successfully!');
        } catch (vErr) {
          console.error('Failed to auto-register vendor:', vErr);
          toast.warning('⚠️ Expense saved, but vendor registration failed.');
        }
      }

      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
          <select name="category" value={formData.category} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {categories.map(cat => <option key={cat} value={cat}>{t(cat.toLowerCase()) || cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('amount')} (₹)</label>
          <input type="number" name="amount" required value={formData.amount} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('vendor')} / {t('person')} ({t('optional')})</label>
          <input 
            type="text" 
            name="vendor" 
            value={formData.vendor} 
            onChange={handleChange} 
            placeholder="e.g. Catering Co."
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
          />
          {formData.vendor && (
            <div className="mt-2.5 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="saveAsVendor" 
                  checked={saveAsVendor} 
                  onChange={(e) => setSaveAsVendor(e.target.checked)} 
                  className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="saveAsVendor" className="text-xs font-bold text-purple-700 dark:text-purple-400 cursor-pointer select-none">
                  ✨ Save as Registered Vendor?
                </label>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                💡 <strong>Why register?</strong> Saving this will instantly register `{formData.vendor}` in your central <strong>Vendor Directory</strong> so you can keep their phone number and track deal totals in one place!
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid By (Member Name)</label>
          <input type="text" name="paidBy" required value={formData.paidBy} onChange={handleChange} placeholder="e.g. Papa, Chacha, Self"
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>

      {saveAsVendor && formData.vendor && (
        <div className="grid grid-cols-2 gap-4 p-3.5 bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 rounded-xl animate-fadeIn">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Contact Number
            </label>
            <input 
              type="text" 
              value={vendorContact} 
              onChange={(e) => setVendorContact(e.target.value)} 
              placeholder="e.g. 9876543210"
              className="w-full p-2 text-sm border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Booked Deal Price (Deal Amount)
            </label>
            <input 
              type="number" 
              value={vendorBookedPrice} 
              onChange={(e) => setVendorBookedPrice(e.target.value)} 
              placeholder={formData.amount || "e.g. 50000"}
              className="w-full p-2 text-sm border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
          <input type="date" name="expenseDate" required value={formData.expenseDate} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('paymentStatus')}</label>
          <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} 
            className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="Paid">{t('paid')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="Partial">{t('partial')}</option>
          </select>
        </div>
        {formData.paymentStatus !== 'Pending' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('paymentMethod')}</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} 
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="Cash">{t('cash')}</option>
              <option value="Card">{t('card')}</option>
              <option value="UPI">{t('upi')}</option>
              <option value="Bank Transfer">{t('bankTransfer')}</option>
              <option value="Other">{t('other')}</option>
            </select>
          </div>
        )}
        
        {formData.paymentStatus === 'Partial' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Amount (₹)</label>
            <input type="number" name="paidAmount" required value={formData.paidAmount} onChange={handleChange} placeholder="Enter amount already paid"
              className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        )}
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
            <Cpu size={16} className="text-purple-600 animate-pulse" />
            AI OCR Scanner & Receipt Attachment (Optional)
          </label>
          <div className="border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl p-3.5 bg-purple-50/30 dark:bg-purple-950/10 hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition">
            <input 
              type="file" 
              accept="image/*" 
              onChange={uploadFileHandler} 
              className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:hover:file:bg-purple-900/60 dark:file:bg-purple-900/40 dark:file:text-purple-400 cursor-pointer"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
              💡 <strong>Instant Auto-fill:</strong> Upload any invoice or receipt photo to automatically extract amount, vendor, date, and category.
            </p>
            {ocrLoading && (
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
                <Cpu size={14} className="animate-spin" />
                OCR Engine is parsing receipt text...
              </div>
            )}
            {uploading && (
              <div className="text-[11px] text-gray-500 mt-1">
                ☁️ Cloudinary: Syncing document copy...
              </div>
            )}
            {formData.billUrl && !ocrLoading && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold mt-2">
                <FileText size={14} />
                Receipt successfully attached and scanned!
              </div>
            )}
          </div>
        </div>

      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes')} ({t('optional')})</label>
        <textarea name="note" value={formData.note} onChange={handleChange} rows="2"
          className="w-full p-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"></textarea>
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading || uploading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? t('adding') : t('addExpense')}
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
