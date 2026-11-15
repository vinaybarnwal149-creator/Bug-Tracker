import { http } from './http.js';

export const projectsApi = {
  getProjects: async () => {
    const res = await http.get('/api/v1/projects');
    return res.data;
  },
  createProject: async (data) => {
    const res = await http.post('/api/v1/projects', data);
    return res.data;
  },
  getProject: async (projectId) => {
    const res = await http.get(`/api/v1/projects/${projectId}`);
    return res.data;
  },
  updateProject: async (projectId, data) => {
    const res = await http.patch(`/api/v1/projects/${projectId}`, data);
    return res.data;
  },
  deleteProject: async (projectId) => {
    return http.delete(`/api/v1/projects/${projectId}`);
  },
  getProjectStats: async (projectId) => {
    const res = await http.get(`/api/v1/projects/${projectId}/stats`);
    return res.data;
  },
  checkKeyAvailable: async (key) => {
    const res = await http.get('/api/v1/projects/key-available', { key });
    return res.data.available;
  },
  addMember: async (projectId, data) => {
    const res = await http.post(`/api/v1/projects/${projectId}/members`, data);
    return res.data;
  },
  updateMemberRole: async (projectId, userId, role) => {
    const res = await http.patch(`/api/v1/projects/${projectId}/members/${userId}`, { role });
    return res.data;
  },
  removeMember: async (projectId, userId) => {
    return http.delete(`/api/v1/projects/${projectId}/members/${userId}`);
  }
};
