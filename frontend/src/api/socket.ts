import { io, type Socket } from 'socket.io-client';
import type { CalendarEvent } from './events';

const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'token';

export interface ServerToClientEvents {
  'event:created': (event: CalendarEvent) => void;
  'event:updated': (event: CalendarEvent) => void;
  'event:deleted': (eventId: string) => void;
}

let socket: Socket<ServerToClientEvents> | null = null;

export const socketService = {
  connect: (): Socket<ServerToClientEvents> => {
    if (socket?.connected) {
      return socket;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      throw new Error('No authentication token found');
    }

    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: { token },
      transports: ['websocket'],
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,
};
