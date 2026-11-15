import { http } from './http.js';

export const commentsApi = {
  getComments: async (ticketId) => {
    const res = await http.get(`/api/v1/tickets/${ticketId}/comments`);
    return res.data;
  },
  createComment: async (ticketId, data) => {
    const res = await http.post(`/api/v1/tickets/${ticketId}/comments`, data);
    return res.data;
  },
  updateComment: async (commentId, data) => {
    const res = await http.patch(`/api/v1/comments/${commentId}`, data);
    return res.data;
  },
  deleteComment: async (commentId) => {
    return http.delete(`/api/v1/comments/${commentId}`);
  }
};
