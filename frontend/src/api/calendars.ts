import axios from 'axios';
import { authService } from './auth';

export interface CalendarPayload {
  title: string;
  description: string;
  color: string;
}

export interface Calendar extends CalendarPayload {
  _id: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const calendarApi = axios.create({
  baseURL: `${API_BASE_URL}/api/calendars`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = authService.getToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const calendarService = {
  list: async (): Promise<Calendar[]> => {
    try {
      const response = await calendarApi.get('/', {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to fetch calendars'));
    }
  },

  create: async (payload: CalendarPayload): Promise<Calendar> => {
    try {
      const response = await calendarApi.post('/', payload, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create calendar'));
    }
  },

  update: async (id: string, payload: CalendarPayload): Promise<Calendar> => {
    try {
      const response = await calendarApi.put(`/${id}`, payload, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to update calendar'));
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await calendarApi.delete(`/${id}`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to delete calendar'));
    }
  },
};
