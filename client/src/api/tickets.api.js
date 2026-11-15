import { http } from './http.js';

export const ticketsApi = {
  getBoard: async (projectId, filters = {}) => {
    const res = await http.get(`/api/v1/projects/${projectId}/board`, filters);
    return res.data;
  },
  getTickets: async (projectId, params = {}) => {
    return http.get(`/api/v1/projects/${projectId}/tickets`, params);
  },
  createTicket: async (projectId, data) => {
    const res = await http.post(`/api/v1/projects/${projectId}/tickets`, data);
    return res.data;
  },
  getTicket: async (ticketId) => {
    const res = await http.get(`/api/v1/tickets/${ticketId}`);
    return res.data;
  },
  updateTicket: async (ticketId, data) => {
    const res = await http.patch(`/api/v1/tickets/${ticketId}`, data);
    return res.data;
  },
  assignTicket: async (ticketId, assigneeId) => {
    const res = await http.put(`/api/v1/tickets/${ticketId}/assignee`, { assigneeId });
    return res.data;
  },
  moveTicket: async (ticketId, moveData) => {
    return http.patch(`/api/v1/tickets/${ticketId}/move`, moveData);
  },
  deleteTicket: async (ticketId) => {
    return http.delete(`/api/v1/tickets/${ticketId}`);
  },
  uploadAttachments: async (ticketId, files) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    const res = await http.upload(`/api/v1/tickets/${ticketId}/attachments`, formData);
    return res.data;
  },
  deleteAttachment: async (ticketId, attachmentId) => {
    return http.delete(`/api/v1/tickets/${ticketId}/attachments/${attachmentId}`);
  }
};
