import { defineStore } from 'pinia';
import { api } from '../services/api.js';
import { flushScoreOutbox } from '../services/scoreOutbox.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    judge: JSON.parse(localStorage.getItem('judge') || 'null'),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin',
    isJudge: (state) => state.user?.role === 'judge'
  },
  actions: {
    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/login', credentials);
        this.token = data.token;
        this.user = data.user;
        this.judge = data.judge || null;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('judge', JSON.stringify(data.judge || null));
        connectSocket();
        if (data.judge?.judgeId) void flushScoreOutbox({ force: true }).catch(() => {});
        return data;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.judge = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('judge');
      disconnectSocket();
    }
  }
});
