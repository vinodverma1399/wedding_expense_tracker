import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, Users, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EVENT_TYPES = ['Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Engagement', 'Other'];
const EVENT_COLORS = {
  Haldi: 'bg-yellow-400', Mehendi: 'bg-green-500', Sangeet: 'bg-pink-500',
  Wedding: 'bg-red-500', Reception: 'bg-purple-600', Engagement: 'bg-blue-500', Other: 'bg-gray-400'
};

const GuestManagement = () => {
  const { t } = useTranslation();
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [filterRSVP, setFilterRSVP] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', side: 'Both',
    rsvpStatus: 'Pending', numberOfPlates: 1, events: [], notes: ''
  });

  useEffect(() => { fetchWeddings(); }, []);
  useEffect(() => { if (selectedWedding) fetchGuests(); }, [selectedWedding]);

  const fetchWeddings = async () => {
    try {
      const { data } = await api.get('/wedding/all');
      setWeddings(data);
      if (data.length > 0) setSelectedWedding(data[0]);
    } catch { toast.error('Failed to load weddings'); }
  };

  const fetchGuests = async () => {
    try {
      const { data } = await api.get(`/guests/${selectedWedding._id}`);
      setGuests(data);
    } catch { toast.error('Failed to load guests'); }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', side: 'Both', rsvpStatus: 'Pending', numberOfPlates: 1, events: [], notes: '' });
    setEditingGuest(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuest) {
        const { data } = await api.put(`/guests/update/${editingGuest._id}`, form);
        setGuests(guests.map(g => g._id === data._id ? data : g));
        toast.success('Guest updated!');
      } else {
        const { data } = await api.post('/guests/add', { ...form, weddingId: selectedWedding._id });
        setGuests([...guests, data]);
        toast.success('Guest added!');
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guest');
    }
  };

  const handleEdit = (guest) => {
    setForm({ name: guest.name, phone: guest.phone, email: guest.email, side: guest.side, rsvpStatus: guest.rsvpStatus, numberOfPlates: guest.numberOfPlates, events: guest.events || [], notes: guest.notes });
    setEditingGuest(guest);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guest?')) return;
    try {
      await api.delete(`/guests/delete/${id}`);
      setGuests(guests.filter(g => g._id !== id));
      toast.success('Guest deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleEvent = (eventName) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(eventName)
        ? prev.events.filter(e => e !== eventName)
        : [...prev.events, eventName]
    }));
  };

  const filteredGuests = guests.filter(g => {
    const matchRSVP = filterRSVP === 'All' || g.rsvpStatus === filterRSVP;
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRSVP && matchSearch;
  });

  const confirmedPlates = guests.filter(g => g.rsvpStatus === 'Confirmed').reduce((acc, g) => acc + g.numberOfPlates, 0);
  const totalConfirmed = guests.filter(g => g.rsvpStatus === 'Confirmed').length;
  const totalPending = guests.filter(g => g.rsvpStatus === 'Pending').length;
  const totalDeclined = guests.filter(g => g.rsvpStatus === 'Declined').length;

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('guestManagement')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('manageGuests')}</p>
          </div>
          <div className="flex gap-3 items-center">
            {weddings.length > 0 && (
              <select className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm outline-none" value={selectedWedding?._id || ''} onChange={(e) => setSelectedWedding(weddings.find(w => w._id === e.target.value))}>
                {weddings.map(w => <option key={w._id} value={w._id}>{w.weddingName}</option>)}
              </select>
            )}
            <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition font-medium flex items-center gap-2">
              <Plus size={18} /> {t('addGuest')}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border-l-4 border-primary">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('totalGuests')}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{guests.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center gap-1">
              <CheckCircle size={14} className="text-green-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('confirmed')}</p>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalConfirmed}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-yellow-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('pending')}</p>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalPending}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('estimatedPlates')}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{confirmedPlates}</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{editingGuest ? 'Edit Guest' : 'Add New Guest'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="Guest full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Side</label>
                <select value={form.side} onChange={e => setForm({...form, side: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white">
                  <option>Bride</option><option>Groom</option><option>Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">RSVP Status</label>
                <select value={form.rsvpStatus} onChange={e => setForm({...form, rsvpStatus: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white">
                  <option>Pending</option><option>Confirmed</option><option>Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Number of Plates</label>
                <input type="number" min="0" value={form.numberOfPlates} onChange={e => setForm({...form, numberOfPlates: parseInt(e.target.value)})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="Dietary needs, etc." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Attending Events</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(event => (
                    <button key={event} type="button" onClick={() => toggleEvent(event)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${form.events.includes(event) ? EVENT_COLORS[event] + ' text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700'}`}>
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">Cancel</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition font-medium">{editingGuest ? 'Update' : 'Add Guest'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search guests..." className="p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white w-full md:w-64" />
            <div className="flex gap-2">
              {['All', 'Confirmed', 'Pending', 'Declined'].map(f => (
                <button key={f} onClick={() => setFilterRSVP(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterRSVP === f ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                  <th className="p-3 font-medium">{t('name')}</th>
                  <th className="p-3 font-medium">Side</th>
                  <th className="p-3 font-medium">{t('phone')}</th>
                  <th className="p-3 font-medium">RSVP</th>
                  <th className="p-3 font-medium">{t('events')}</th>
                  <th className="p-3 font-medium text-center">{t('plates')}</th>
                  <th className="p-3 font-medium text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">No guests found. Add your first guest!</td></tr>
                ) : filteredGuests.map(g => (
                  <tr key={g._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{g.name}</td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400">{t(g.side.toLowerCase()) || g.side}</td>
                    <td className="p-3 text-sm dark:text-gray-300">{g.phone || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        g.rsvpStatus === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        g.rsvpStatus === 'Declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>{t(g.rsvpStatus.toLowerCase()) || g.rsvpStatus}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {g.events?.map(ev => (
                          <span key={ev} className={`${EVENT_COLORS[ev]} text-white text-xs px-1.5 py-0.5 rounded`}>{t(ev.toLowerCase()) || ev}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold dark:text-white">{g.numberOfPlates}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(g)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(g._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestManagement;
