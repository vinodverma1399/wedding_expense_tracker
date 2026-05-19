import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, Calendar, MapPin, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthRequiredModal from '../components/AuthRequiredModal';
import Modal from '../components/Modal';
import { demoWedding, demoEvents } from '../utils/demoData';

const EVENT_TYPES = ['Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Engagement', 'Other'];
const EVENT_STYLES = {
  Haldi:      { bg: 'bg-yellow-400', light: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-300' },
  Mehendi:    { bg: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',   text: 'text-green-800 dark:text-green-300' },
  Sangeet:    { bg: 'bg-pink-500',   light: 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700',       text: 'text-pink-800 dark:text-pink-300' },
  Wedding:    { bg: 'bg-red-500',    light: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',           text: 'text-red-800 dark:text-red-300' },
  Reception:  { bg: 'bg-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700', text: 'text-purple-800 dark:text-purple-300' },
  Engagement: { bg: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',       text: 'text-blue-800 dark:text-blue-300' },
  Other:      { bg: 'bg-gray-500',   light: 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700',          text: 'text-gray-800 dark:text-gray-300' },
};

const Events = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ name: 'Wedding', date: '', budget: '', venue: '', notes: '' });

  // Auth Modal states for Guest/Demo Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('');

  useEffect(() => {
    if (!user) {
      // Instantly load mock wedding & events data if no user is signed in
      setWeddings([demoWedding]);
      setSelectedWedding(demoWedding);
      setEvents(demoEvents);
    } else {
      fetchWeddings();
    }
  }, [user]);

  useEffect(() => { 
    if (selectedWedding && user) {
      const isOwner = selectedWedding.userId === user._id || selectedWedding.userId?._id === user._id;
      const currentRole = selectedWedding.members?.find(m => m.user?._id === user._id || m.user === user._id)?.role;
      if (!isOwner && currentRole === 'Contributor') {
         navigate('/expenses');
         return;
      }
      fetchEvents(); 
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

  const fetchEvents = async () => {
    try {
      const { data } = await api.get(`/events/${selectedWedding._id}`);
      setEvents(data);
    } catch { toast.error('Failed to load events'); }
  };

  const resetForm = () => {
    setForm({ name: 'Wedding', date: '', budget: '', venue: '', notes: '' });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        const { data } = await api.put(`/events/update/${editingEvent._id}`, form);
        setEvents(events.map(ev => ev._id === data._id ? data : ev));
        toast.success('Event updated!');
      } else {
        const { data } = await api.post('/events/create', { ...form, weddingId: selectedWedding._id });
        setEvents([...events, data]);
        toast.success('Event added!');
      }
      resetForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save event'); }
  };

  const handleEdit = (event) => {
    setForm({
      name: event.name,
      date: event.date ? event.date.split('T')[0] : '',
      budget: event.budget,
      venue: event.venue,
      notes: event.notes
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!user) {
      setAuthActionName('delete wedding events');
      setIsAuthModalOpen(true);
      return;
    }
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/delete/${id}`);
      setEvents(events.filter(ev => ev._id !== id));
      toast.success('Event deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const totalEventBudget = events.reduce((acc, ev) => acc + (ev.budget || 0), 0);
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date();
  const upcomingEvents = sortedEvents.filter(ev => ev.date && new Date(ev.date) >= today);
  const pastEvents = sortedEvents.filter(ev => ev.date && new Date(ev.date) < today);

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('eventsCountdowns')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('manageEvents')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {weddings.length > 0 && (
              <select className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none w-full md:w-auto flex-grow md:flex-grow-0 cursor-pointer" value={selectedWedding?._id || ''} onChange={(e) => {
                const chosen = weddings.find(w => w._id === e.target.value);
                setSelectedWedding(chosen);
                if (chosen) localStorage.setItem('selectedWeddingId', chosen._id);
              }}>
                {weddings.map(w => <option key={w._id} value={w._id}>{w.weddingName}</option>)}
              </select>
            )}
            <button onClick={() => {
              if (!user) {
                setAuthActionName('add wedding events');
                setIsAuthModalOpen(true);
              } else {
                resetForm();
                setShowForm(true);
              }
            }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition font-medium flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto flex-grow md:flex-grow-0">
              <Plus size={18} /> {t('events')}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border-l-4 border-primary">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('events')}</p>
            <p className="text-2xl font-bold dark:text-white">{events.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Upcoming</p>
            <p className="text-2xl font-bold dark:text-white">{upcomingEvents.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('totalBudget')}</p>
            <p className="text-2xl font-bold dark:text-white">₹{totalEventBudget.toLocaleString()}</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        <Modal isOpen={showForm} onClose={resetForm} title={editingEvent ? 'Edit Event' : 'Add New Event'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Event Type *</label>
              <select required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white">
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Budget (₹)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Venue</label>
              <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="Venue name or address" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full p-2 border dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:text-white" placeholder="Additional details..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">Cancel</button>
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition font-medium">{editingEvent ? 'Update' : 'Add Event'}</button>
            </div>
          </form>
        </Modal>

        {/* Events Timeline */}
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-xl text-center shadow-sm border dark:border-gray-800">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No events added yet. Plan your Haldi, Mehendi, Sangeet and more!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('upcoming')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map(ev => {
                    const style = EVENT_STYLES[ev.name] || EVENT_STYLES.Other;
                    const daysLeft = ev.date ? Math.ceil((new Date(ev.date) - today) / (1000*60*60*24)) : null;
                    return (
                      <div key={ev._id} className={`border rounded-xl p-5 shadow-sm ${style.light}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`${style.bg} text-white text-xs font-bold px-3 py-1 rounded-full`}>{t(ev.name.toLowerCase()) || ev.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => {
                              if (!user) {
                                setAuthActionName('edit wedding event details');
                                setIsAuthModalOpen(true);
                              } else {
                                handleEdit(ev);
                              }
                            }} className="p-1 text-gray-500 hover:text-blue-500 transition cursor-pointer"><Edit2 size={15}/></button>
                            <button onClick={() => handleDelete(ev._id)} className="p-1 text-gray-500 hover:text-red-500 transition cursor-pointer"><Trash2 size={15}/></button>
                          </div>
                        </div>
                        {ev.date && (
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span className={`font-semibold ${style.text}`}>{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        )}
                        {daysLeft !== null && <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">{daysLeft === 0 ? 'Today!' : `${daysLeft} days left`}</p>}
                        {ev.venue && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <MapPin size={13} /> {ev.venue}
                          </div>
                        )}
                        {ev.budget > 0 && (
                          <div className="flex items-center gap-1 text-sm font-bold text-gray-800 dark:text-white">
                            <IndianRupee size={13} /> {ev.budget.toLocaleString()}
                          </div>
                        )}
                        {ev.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{ev.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{t('pastEvents')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                  {pastEvents.map(ev => {
                    const style = EVENT_STYLES[ev.name] || EVENT_STYLES.Other;
                    return (
                      <div key={ev._id} className="border dark:border-gray-700 rounded-xl p-5 shadow-sm bg-white dark:bg-gray-900">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">{t(ev.name.toLowerCase()) || ev.name} ✓</span>
                          <button onClick={() => handleDelete(ev._id)} className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 size={15}/></button>
                        </div>
                        {ev.date && <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                        {ev.venue && <p className="text-xs text-gray-400 mt-1">{ev.venue}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

export default Events;
