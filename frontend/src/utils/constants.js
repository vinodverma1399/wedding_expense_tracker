let rawUrl = import.meta.env.VITE_API_URL;
let socketUrl = import.meta.env.VITE_SOCKET_URL;

if (!rawUrl) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    rawUrl = 'https://wedding-expense-tracker-pw8u.onrender.com/api';
  } else {
    rawUrl = 'http://localhost:5000/api';
  }
}

if (!socketUrl) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    socketUrl = 'https://wedding-expense-tracker-pw8u.onrender.com';
  } else {
    socketUrl = 'http://localhost:5000';
  }
}

if (rawUrl && !rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/')) {
  rawUrl = rawUrl.replace(/\/$/, '') + '/api';
}

export const API_URL = rawUrl;
export const SOCKET_URL = socketUrl;
