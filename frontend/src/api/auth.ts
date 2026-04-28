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

const MOCK_TOKEN = 'mock-jwt-token-12345';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email && password) {
      localStorage.setItem('token', MOCK_TOKEN);
      return { 
        success: true, 
        user: { name: 'Vintage User', email },
        token: MOCK_TOKEN 
      };
    }
    throw new Error('Invalid email or password');
  },

  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (name && email && password) {
      localStorage.setItem('token', MOCK_TOKEN);
      return { 
        success: true, 
        user: { name, email },
        token: MOCK_TOKEN 
      };
    }
    throw new Error('Please fill in all fields');
  },

  logout: (): void => {
    localStorage.removeItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
};
