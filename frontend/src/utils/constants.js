let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (rawUrl && !rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/')) {
  rawUrl = rawUrl.replace(/\/$/, '') + '/api';
}
export const API_URL = rawUrl;
