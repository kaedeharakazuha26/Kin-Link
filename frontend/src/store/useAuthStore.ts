import { create } from 'zustand';
import { api } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUserProfileState: (updated: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: false,
  isCheckingAuth: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  updateUserProfileState: (updated) => {
    const current = get().user;
    if (current) {
      const newUser = { ...current, ...updated };
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, accessToken: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        set({ user: res.data.user, isCheckingAuth: false });
      } else {
        set({ user: null, isCheckingAuth: false });
      }
    } catch (error) {
      console.warn('Check auth session expired or server offline');
      // If cached user exists and token was stored, allow offline/local inspection or clear
      set({ isCheckingAuth: false });
    }
  },

  login: async (emailOrUsername, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { emailOrUsername, password });
      const { user, accessToken, refreshToken } = res.data;

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, accessToken, isLoading: false });
      toast.success(`Welcome back, ${user.fullName}!`);
      return true;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message;
      const networkMsg = error.message === 'Network Error'
        ? 'Cannot connect to backend. Check backend URL, Render service status, or CORS.'
        : error.message;
      const msg = serverMsg || networkMsg || 'Login failed. Please check your credentials.';
      toast.error(msg, { duration: 5000 });
      set({ isLoading: false });
      return false;
    }
  },

  register: async (email, password, fullName, username) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { email, password, fullName, username });
      const { user, accessToken, refreshToken } = res.data;

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, accessToken, isLoading: false });
      toast.success('Account created successfully!');
      return true;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message;
      const networkMsg = error.message === 'Network Error'
        ? 'Cannot connect to backend. Check backend URL, Render service status, or CORS.'
        : error.message;
      const msg = serverMsg || networkMsg || 'Registration failed. Please try again.';
      toast.error(msg, { duration: 5000 });
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null });
      toast.success('Logged out.');
    }
  },
}));
