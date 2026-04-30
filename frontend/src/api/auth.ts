import axios from 'axios';

export interface User {
  id?: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

const TOKEN_KEY = 'token';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Invalid email or password'));
    }
  },

  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/signup', { name, email, password });
      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'An error occurred during signup'));
    }
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await authApi.get('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to fetch current user'));
    }
  }
};
