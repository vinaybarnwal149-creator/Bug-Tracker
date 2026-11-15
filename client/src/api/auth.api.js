import { http, setAccessToken } from './http.js';

export const authApi = {
  register: async (data) => {
    const res = await http.post('/api/v1/auth/register', data);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res.data;
  },
  login: async (credentials) => {
    const res = await http.post('/api/v1/auth/login', credentials);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res.data;
  },
  refresh: async () => {
    const res = await http.post('/api/v1/auth/refresh');
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res.data;
  },
  logout: async () => {
    try {
      await http.post('/api/v1/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },
  getMe: async () => {
    const res = await http.get('/api/v1/auth/me');
    return res.data.user;
  },
  updateProfile: async (data) => {
    const res = await http.patch('/api/v1/users/me', data);
    return res.data.user;
  },
  updatePassword: async (data) => {
    return http.patch('/api/v1/users/me/password', data);
  }
};
