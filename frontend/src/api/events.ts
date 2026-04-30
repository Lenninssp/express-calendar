import axios from 'axios';
import { authService } from './auth';

export interface EventPayload {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  calendarId: string;
}

export interface CalendarEvent extends EventPayload {
  _id: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const eventApi = axios.create({
  baseURL: `${API_BASE_URL}/api/events`,
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

export const eventService = {
  list: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await eventApi.get('/', {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to fetch events'));
    }
  },

  getById: async (id: string): Promise<CalendarEvent> => {
    try {
      const response = await eventApi.get(`/${id}`, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to fetch event details'));
    }
  },

  create: async (payload: EventPayload): Promise<CalendarEvent> => {
    try {
      const response = await eventApi.post('/', payload, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create event'));
    }
  },

  update: async (id: string, payload: EventPayload): Promise<CalendarEvent> => {
    try {
      const response = await eventApi.put(`/${id}`, payload, {
        headers: getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to update event'));
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await eventApi.delete(`/${id}`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to delete event'));
    }
  },
};
