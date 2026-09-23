import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from './firebase';

// Same-origin /api — Next.js rewrites to Django locally and to Render on Vercel
// (set NEXT_PUBLIC_API_URL or API_URL at build time to the Render host, no trailing slash).
const BASE_URL = '';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (id_token: string, display_name?: string) =>
    api.post('/api/auth/login/', { id_token, display_name }),
  register: (email: string, password: string, display_name: string) =>
    api.post('/api/auth/register/', { email, password, display_name }),
  me: () => api.get('/api/auth/me/'),
  logout: () => api.post('/api/auth/logout/'),
  resetPassword: (email: string) => api.post('/api/auth/reset-password/', { email }),
  users: () => api.get('/api/auth/users/'),
  updateRole: (uid: string, role: 'admin' | 'editor' | 'viewer') =>
    api.patch(`/api/auth/users/${uid}/`, { role }),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/api/dashboard/summary/'),
  charts: () => api.get('/api/dashboard/charts/'),
  calendar: (year: number, month: number) =>
    api.get(`/api/dashboard/calendar/?year=${year}&month=${month}`),
};

// ─── Contracts ───────────────────────────────────────────────────────────────
export const contractsApi = {
  list: (params?: { status?: string; client_id?: string; search?: string }) =>
    api.get('/api/contracts/', { params }),
  get: (id: string) => api.get(`/api/contracts/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/api/contracts/', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/contracts/${id}/`, data),
  delete: (id: string) => api.delete(`/api/contracts/${id}/`),
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/contracts/upload-file/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  pause: (id: string, pause_reason: string) =>
    api.post(`/api/contracts/${id}/pause/`, { pause_reason }),
  resume: (id: string) => api.post(`/api/contracts/${id}/resume/`),
  snooze: (id: string, data: { snooze_days?: number; custom_date?: string }) =>
    api.post(`/api/contracts/${id}/snooze/`, data),
  unsnooze: (id: string) => api.post(`/api/contracts/${id}/unsnooze/`),
  renew: (id: string, data: { new_end_date: string; new_start_date?: string; notes?: string }) =>
    api.post(`/api/contracts/${id}/renew/`, data),
  versions: (id: string) => api.get(`/api/contracts/${id}/versions/`),
  fileUrl: (id: string) => api.get(`/api/contracts/${id}/file-url/`),
  /** Comments */
  getComments: (id: string) => api.get(`/api/contracts/${id}/comments/`),
  addComment: (id: string, text: string) =>
    api.post(`/api/contracts/${id}/comments/`, { text }),
  deleteComment: (contractId: string, commentId: string) =>
    api.delete(`/api/contracts/${contractId}/comments/`, { data: { comment_id: commentId } }),
};



// ─── AI Extraction ───────────────────────────────────────────────────────────
export const aiApi = {
  extract: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/ai/extract/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
  reExtract: (storage_path: string) =>
    api.post('/api/ai/re-extract/', { storage_path }),
};

// ─── Clients ─────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => api.get('/api/clients/'),
  get: (id: string) => api.get(`/api/clients/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/api/clients/', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/clients/${id}/`, data),
  delete: (id: string) => api.delete(`/api/clients/${id}/`),
  pause: (id: string, pause_reason: string) =>
    api.post(`/api/clients/${id}/pause/`, { pause_reason }),
  resume: (id: string) => api.post(`/api/clients/${id}/resume/`),
  emails: (id: string) => api.get(`/api/clients/${id}/emails/`),
};

// ─── Reminders ───────────────────────────────────────────────────────────────
export const remindersApi = {
  logs: () => api.get('/api/reminders/'),
  sendManual: (contract_id: string) =>
    api.post(`/api/reminders/${contract_id}/send/`),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  logs: (params?: { action?: string; resource_type?: string }) =>
    api.get('/api/audit/', { params }),
};

export default api;
