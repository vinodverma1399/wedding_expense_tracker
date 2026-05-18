import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, Users, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthRequiredModal from '../components/AuthRequiredModal';
import Modal from '../components/Modal';
import { demoWedding, demoGuests } from '../utils/demoData';

const EVENT_TYPES = ['Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Engagement', 'Other'];
const EVENT_COLORS = {
  Haldi: 'bg-yellow-400', Mehendi: 'bg-green-500', Sangeet: 'bg-pink-500',
  Wedding: 'bg-red-500', Reception: 'bg-purple-600', Engagement: 'bg-blue-500', Other: 'bg-gray-400'
};

const GuestManagement = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [filterRSVP, setFilterRSVP] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterSide, setFilterSide] = useState('All');
  const [filterEvent, setFilterEvent] = useState('All');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', side: 'Both',
    rsvpStatus: 'Pending', numberOfPlates: 1, events: [], notes: ''
  });

  // Auth Modal states for Guest/Demo Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('');

  useEffect(() => {
    if (!user) {
      // Instantly load mock wedding & guest data if no user is signed in
      setWeddings([demoWedding]);
      setSelectedWedding(demoWedding);
      setGuests(demoGuests);
    } else {
      fetchWeddings();
    }
  }, [user]);

  useEffect(() => { 
    if (selectedWedding && user) {
      const isOwner = selectedWedding.userId === user._id || selectedWedding.userId?._id === user._id;
      const currentRole = selectedWedding.members?.find(m => m.user._id === user._id || m.user === user._id)?.role;
      if (!isOwner && currentRole === 'Contributor') {
         navigate('/expenses');
         return;
      }
      fetchGuests(); 
    }
  }, [selectedWedding, user]);

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
    if (!user) {
      setAuthActionName('delete guests');
      setIsAuthModalOpen(true);
      return;
    }
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
    const matchSide = filterSide === 'All' || g.side === filterSide;
    const matchEvent = filterEvent === 'All' || (g.events && g.events.includes(filterEvent));
    return matchRSVP && matchSearch && matchSide && matchEvent;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'plates-desc') return b.numberOfPlates - a.numberOfPlates;
    if (sortBy === 'plates-asc') return a.numberOfPlates - b.numberOfPlates;
    return 0;
  });

  const confirmedPlates = guests.filter(g => g.rsvpStatus === 'Confirmed').reduce((acc, g) => acc + g.numberOfPlates, 0);
  const totalConfirmed = guests.filter(g => g.rsvpStatus === 'Confirmed').length;
  const totalPending = guests.filter(g => g.rsvpStatus === 'Pending').length;
  const totalDeclined = guests.filter(g => g.rsvpStatus === 'Declined').length;
  
  const filteredTotalPlates = filteredGuests.reduce((acc, g) => acc + g.numberOfPlates, 0);

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('guestManagement')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('manageGuests')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {weddings.length > 0 && (
              <select className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm outline-none w-full md:w-auto flex-grow md:flex-grow-0 cursor-pointer" value={selectedWedding?._id || ''} onChange={(e) => {
                const chosen = weddings.find(w => w._id === e.target.value);
                setSelectedWedding(chosen);
                if (chosen) localStorage.setItem('selectedWeddingId', chosen._id);
              }}>
                {weddings.map(w => <option key={w._id} value={w._id}>{w.weddingName}</option>)}
              </select>
            )}
            <button onClick={() => {
              if (!user) {
                setAuthActionName('add guests');
                setIsAuthModalOpen(true);
              } else {
                resetForm();
                setShowForm(true);
              }
            }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition font-medium flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto flex-grow md:flex-grow-0">
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
        <Modal isOpen={showForm} onClose={resetForm} title={editingGuest ? 'Edit Guest' : 'Add New Guest'}>
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
            <div className="md:col-span-2 flex justify-end gap-2 pt-4 mt-2 border-t dark:border-gray-800">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">Cancel</button>
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition font-medium">{editingGuest ? 'Update' : 'Add Guest'}</button>
            </div>
          </form>
        </Modal>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="w-full md:w-auto p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center md:inline-flex md:mr-auto">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Displayed:</span>
              <span className="ml-3 text-lg font-bold text-primary dark:text-purple-400">{filteredGuests.length} Guests • {filteredTotalPlates} Plates</span>
            </div>
            
            <div className="w-full md:w-48">
              <select 
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white font-medium shadow-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="plates-desc">Plates: High to Low</option>
                <option value="plates-asc">Plates: Low to High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search guests..." className="p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white w-full sm:w-48" />
              <select value={filterSide} onChange={e => setFilterSide(e.target.value)} className="p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white w-full sm:w-32 cursor-pointer">
                <option value="All">All Sides</option>
                <option value="Bride">Bride</option>
                <option value="Groom">Groom</option>
                <option value="Both">Both</option>
              </select>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className="p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white w-full sm:w-36 cursor-pointer">
                <option value="All">All Events</option>
                {EVENT_TYPES.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full justify-start md:justify-end">
              {['All', 'Confirmed', 'Pending', 'Declined'].map(f => (
                <button key={f} onClick={() => setFilterRSVP(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex-shrink-0 ${filterRSVP === f ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto hidden md:block">
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
                    <td className="p-3 text-sm dark:text-gray-300">
                      {g.phone ? (
                        <a href={`tel:${g.phone}`} className="text-primary hover:underline font-mono">{g.phone}</a>
                      ) : '-'}
                    </td>
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
                        <button onClick={() => {
                          if (!user) {
                            setAuthActionName('edit guest details');
                            setIsAuthModalOpen(true);
                          } else {
                            handleEdit(g);
                          }
                        }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition cursor-pointer"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(g._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-4">
            {filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No guests found. Add your first guest!</div>
            ) : (
              filteredGuests.map(g => (
                <div key={g._id} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border dark:border-gray-800 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{g.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t(g.side.toLowerCase()) || g.side} • {g.numberOfPlates} {t('plates')}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      g.rsvpStatus === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      g.rsvpStatus === 'Declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>{t(g.rsvpStatus.toLowerCase()) || g.rsvpStatus}</span>
                  </div>

                  {g.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">{t('phone')}:</span>
                      <a href={`tel:${g.phone}`} className="text-primary hover:underline font-mono">{g.phone}</a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {g.events?.map(ev => (
                      <span key={ev} className={`${EVENT_COLORS[ev]} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>{t(ev.toLowerCase()) || ev}</span>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-800/60">
                    <button onClick={() => {
                      if (!user) {
                        setAuthActionName('edit guest details');
                        setIsAuthModalOpen(true);
                      } else {
                        handleEdit(g);
                      }
                    }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition font-medium cursor-pointer">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(g._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium cursor-pointer">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <AuthRequiredModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        actionName={authActionName} 
      />
    </div>
  );
};

export default GuestManagement;
