import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Cpu, FileText } from 'lucide-react';

const AddExpenseForm = ({ weddingId, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: 'Venue',
    amount: '',
    vendor: '',
    note: '',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    expenseDate: new Date().toISOString().split('T')[0],
    billUrl: ''
  });
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
      const { data } = await api.post('/expense/add', { ...formData, weddingId });
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input type="number" name="amount" required value={formData.amount} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Person (Optional)</label>
          <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" name="expenseDate" required value={formData.expenseDate} onChange={handleChange} 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
            <Cpu size={16} className="text-purple-600 animate-pulse" />
            AI OCR Scanner & Receipt Attachment (Optional)
          </label>
          <div className="border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl p-3.5 bg-purple-50/30 dark:bg-purple-950/10 hover:bg-purple-50/60 transition">
            <input 
              type="file" 
              accept="image/*" 
              onChange={uploadFileHandler} 
              className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/40 dark:file:text-purple-400 cursor-pointer"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
        <textarea name="note" value={formData.note} onChange={handleChange} rows="2"
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
      </div>

      <div className="pt-4">
        <button type="submit" disabled={loading || uploading} 
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-purple-800 transition font-medium disabled:opacity-50">
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
