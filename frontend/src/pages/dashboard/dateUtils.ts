import type { CalendarEvent } from '../../api/events';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTimeInput = (value: string) => {
  if (!value) return '';

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatDateTimeLabel = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const formatTimeLabel = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

export const getMonthLabel = (date: Date) =>
  date.toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

export const getMonthGrid = (date: Date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOffset = startOfMonth.getDay();
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return current;
  });
};

export const getDefaultEventRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);

  const end = new Date(date);
  end.setHours(10, 0, 0, 0);

  return {
    start: formatDateTimeInput(start.toISOString()),
    end: formatDateTimeInput(end.toISOString()),
  };
};

export const buildEventsByDay = (events: CalendarEvent[]) =>
  events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = formatDateKey(new Date(event.start));

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(event);
    acc[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return acc;
  }, {});
