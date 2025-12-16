import { defineStore } from 'pinia';
import { authApi, usersApi } from '../api';
import type { AuthPayload, AuthUser } from '../types';
import { clearDownloadTokens } from '../utils/downloadTokens';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false,
    initialized: false,
  }),
  actions: {
    setSession(payload: AuthPayload) {
      this.user = payload.user;
      this.accessToken = payload.accessToken;
      this.refreshToken = payload.refreshToken;
       this.initialized = true;
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
    },
    async hydrate() {
      if (this.initialized) return;
      if (!this.accessToken) {
        this.initialized = true;
        return;
      }
      try {
        const profile = await usersApi.me();
        this.user = profile;
        this.initialized = true;
      } catch (error) {
        this.logout();
      }
    },
    async register(payload: { name: string; email: string; password: string }) {
      this.loading = true;
      try {
        const response = await authApi.register(payload);
        this.setSession(response);
      } finally {
        this.loading = false;
      }
    },
    async login(payload: { email: string; password: string }) {
      this.loading = true;
      try {
        const response = await authApi.login(payload);
        this.setSession(response);
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.initialized = true;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearDownloadTokens();
    },
  },
});
