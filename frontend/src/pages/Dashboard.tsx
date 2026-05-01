import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { calendarService, type Calendar, type CalendarPayload } from '../api/calendars';
import { eventService, type CalendarEvent, type EventPayload } from '../api/events';
import { socketService } from '../api/socket';
import CalendarManagementSection from './dashboard/CalendarManagementSection';
import CalendarMonthView from './dashboard/CalendarMonthView';
import EventSidePanel from './dashboard/EventSidePanel';
import ToastStack from './dashboard/ToastStack';
import { formatDateTimeInput, getDefaultEventRange } from './dashboard/dateUtils';
import type { EventPanelMode } from './dashboard/types';

const DEFAULT_FORM: CalendarPayload = {
  title: '',
  description: '',
  color: '#4c5f7c',
};

const DEFAULT_EVENT_FORM: EventPayload = {
  title: '',
  description: '',
  start: '',
  end: '',
  location: '',
  calendarId: '',
};

interface Toast {
  id: number;
  message: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState<CalendarPayload>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [eventForm, setEventForm] = useState<EventPayload>(DEFAULT_EVENT_FORM);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventPanelMode, setEventPanelMode] = useState<EventPanelMode>('closed');
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [eventError, setEventError] = useState('');
  const [eventSuccessMessage, setEventSuccessMessage] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const handleLogout = () => {
    socketService.disconnect();
    authService.logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setEventsLoading(true);
        setError('');
        setEventError('');

        const [calendarData, eventData] = await Promise.all([
          calendarService.list(),
          eventService.list(),
        ]);

        setCalendars(calendarData);
        setEvents(eventData);
        setEventForm((current) => ({
          ...current,
          calendarId: current.calendarId || calendarData[0]?._id || '',
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to fetch dashboard data';
        setError(message);

        if (message.toLowerCase().includes('token')) {
          socketService.disconnect();
          authService.logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
        setEventsLoading(false);
      }
    };

    void loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, 3200),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  useEffect(() => {
    let isMounted = true;
    let socketCleanup: (() => void) | undefined;

    try {
      const socket = socketService.connect();

      const handleEventCreated = (incomingEvent: CalendarEvent) => {
        if (!isMounted) {
          return;
        }

        setEvents((current) => {
          if (current.some((event) => event._id === incomingEvent._id)) {
            return current;
          }

          addToast(`Event created: ${incomingEvent.title}`);

          return [...current, incomingEvent].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
          );
        });
      };

      const handleEventUpdated = (incomingEvent: CalendarEvent) => {
        if (!isMounted) {
          return;
        }

        setEvents((current) => {
          const hasMatch = current.some((event) => event._id === incomingEvent._id);
          const nextEvents = hasMatch
            ? current.map((event) => (event._id === incomingEvent._id ? incomingEvent : event))
            : [...current, incomingEvent];

          addToast(`Event updated: ${incomingEvent.title}`);

          return nextEvents.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
          );
        });

        setSelectedEvent((current) =>
          current?._id === incomingEvent._id ? incomingEvent : current,
        );

        setEventForm((current) => {
          if (editingEventId !== incomingEvent._id && selectedEvent?._id !== incomingEvent._id) {
            return current;
          }

          return {
            title: incomingEvent.title,
            description: incomingEvent.description || '',
            start: formatDateTimeInput(incomingEvent.start),
            end: formatDateTimeInput(incomingEvent.end),
            location: incomingEvent.location || '',
            calendarId: incomingEvent.calendarId,
          };
        });
      };

      const handleEventDeleted = (deletedEventId: string) => {
        if (!isMounted) {
          return;
        }

        addToast('Event deleted');
        setEvents((current) => current.filter((event) => event._id !== deletedEventId));

        if (selectedEvent?._id === deletedEventId || editingEventId === deletedEventId) {
          setSelectedEvent(null);
          setEditingEventId(null);
          setEventPanelMode('closed');
          setEventForm(DEFAULT_EVENT_FORM);
        }
      };

      socket.on('event:created', handleEventCreated);
      socket.on('event:updated', handleEventUpdated);
      socket.on('event:deleted', handleEventDeleted);

      socketCleanup = () => {
        socket.off('event:created', handleEventCreated);
        socket.off('event:updated', handleEventUpdated);
        socket.off('event:deleted', handleEventDeleted);
      };
    } catch {
      socketCleanup = undefined;
    }

    return () => {
      isMounted = false;
      socketCleanup?.();
    };
  }, [editingEventId, selectedEvent]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const resetEventPanel = (calendarId?: string, date?: Date) => {
    const nextCalendarId =
      calendarId ?? (selectedCalendarId !== 'all' ? selectedCalendarId : calendars[0]?._id || '');
    const range = date ? getDefaultEventRange(date) : { start: '', end: '' };

    setEventForm({
      ...DEFAULT_EVENT_FORM,
      ...range,
      calendarId: nextCalendarId,
    });
    setSelectedEvent(null);
    setEditingEventId(null);
  };

  const closeEventPanel = () => {
    setEventPanelMode('closed');
    setEventError('');
    resetEventPanel();
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEventFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setEventForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = (calendar: Calendar) => {
    setEditingId(calendar._id);
    setForm({
      title: calendar.title,
      description: calendar.description || '',
      color: calendar.color,
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (editingId) {
        const updatedCalendar = await calendarService.update(editingId, form);
        setCalendars((current) =>
          current.map((calendar) =>
            calendar._id === editingId ? updatedCalendar : calendar,
          ),
        );
        setSuccessMessage('Calendar updated.');
      } else {
        const newCalendar = await calendarService.create(form);
        setCalendars((current) => [newCalendar, ...current]);
        setSuccessMessage('Calendar created.');
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save calendar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setSuccessMessage('');

    try {
      await calendarService.remove(id);
      setCalendars((current) => current.filter((calendar) => calendar._id !== id));
      setEvents((current) => current.filter((event) => event.calendarId !== id));

      if (editingId === id) {
        resetForm();
      }

      if (selectedCalendarId === id) {
        setSelectedCalendarId('all');
      }

      setSuccessMessage('Calendar deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete calendar');
    }
  };

  const openCreateEventPanel = (calendarId?: string, date?: Date) => {
    resetEventPanel(calendarId, date);
    setEventError('');
    setEventSuccessMessage('');
    setEventPanelMode('create');
  };

  const handleEventClick = async (id: string) => {
    setEventError('');
    setEventSuccessMessage('');

    try {
      const data = await eventService.getById(id);
      setSelectedEvent(data);
      setEditingEventId(null);
      setEventForm({
        title: data.title,
        description: data.description || '',
        start: formatDateTimeInput(data.start),
        end: formatDateTimeInput(data.end),
        location: data.location || '',
        calendarId: data.calendarId,
      });
      setEventPanelMode('view');
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Unable to fetch event details');
      setEventPanelMode('closed');
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event._id);
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start: formatDateTimeInput(event.start),
      end: formatDateTimeInput(event.end),
      location: event.location || '',
      calendarId: event.calendarId,
    });
    setEventError('');
    setEventSuccessMessage('');
    setEventPanelMode('edit');
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEventSubmitting(true);
    setEventError('');
    setEventSuccessMessage('');

    if (!eventForm.calendarId) {
      setEventError('Select a calendar for this event.');
      setEventSubmitting(false);
      return;
    }

    if (new Date(eventForm.end) < new Date(eventForm.start)) {
      setEventError('End time must be after start time.');
      setEventSubmitting(false);
      return;
    }

    try {
      if (editingEventId) {
        const updatedEvent = await eventService.update(editingEventId, eventForm);
        setEvents((current) =>
          current
            .map((item) => (item._id === editingEventId ? updatedEvent : item))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
        );
        setSelectedEvent(updatedEvent);
        setEventPanelMode('view');
        setEventSuccessMessage('Event updated.');
      } else {
        const newEvent = await eventService.create(eventForm);
        setEvents((current) =>
          [...current, newEvent].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
          ),
        );
        setSelectedEvent(newEvent);
        setEditingEventId(newEvent._id);
        setEventPanelMode('view');
        setEventSuccessMessage('Event created.');
      }
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Unable to save event');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEventError('');
    setEventSuccessMessage('');

    try {
      await eventService.remove(id);
      setEvents((current) => current.filter((item) => item._id !== id));
      closeEventPanel();
      setEventSuccessMessage('Event deleted.');
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Unable to delete event');
    }
  };

  const filteredEvents = events.filter((event) =>
    selectedCalendarId === 'all' ? true : event.calendarId === selectedCalendarId,
  );

  const calendarNameById = new Map(calendars.map((calendar) => [calendar._id, calendar.title]));
  const calendarColorById = new Map(calendars.map((calendar) => [calendar._id, calendar.color]));

  return (
    <div className="min-h-screen p-6 md:p-8">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <header className="max-w-6xl mx-auto flex flex-col gap-5 md:flex-row md:justify-between md:items-center mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-secondary mb-3">Dashboard</p>
          <h1 className="text-4xl md:text-5xl">Your Calendars</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-outline text-on-surface-variant rounded-md hover:bg-surface-container transition-colors self-start"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <CalendarManagementSection
          calendars={calendars}
          editingId={editingId}
          form={form}
          loading={loading}
          submitting={submitting}
          error={error}
          successMessage={successMessage}
          onFormChange={handleChange}
          onSubmit={handleSubmit}
          onEdit={handleEdit}
          onDelete={(id) => void handleDelete(id)}
          onReset={resetForm}
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <CalendarMonthView
            calendars={calendars}
            selectedCalendarId={selectedCalendarId}
            calendarViewDate={calendarViewDate}
            eventsLoading={eventsLoading}
            filteredEvents={filteredEvents}
            eventError={eventError}
            eventSuccessMessage={eventSuccessMessage}
            calendarColorById={calendarColorById}
            onCalendarFilterChange={setSelectedCalendarId}
            onPrevMonth={() => setCalendarViewDate(
              new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1),
            )}
            onToday={() => setCalendarViewDate(new Date())}
            onNextMonth={() => setCalendarViewDate(
              new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1),
            )}
            onCreateEvent={openCreateEventPanel}
            onOpenEvent={(id) => void handleEventClick(id)}
          />

          <EventSidePanel
            calendars={calendars}
            eventForm={eventForm}
            eventPanelMode={eventPanelMode}
            selectedEvent={selectedEvent}
            editingEventId={editingEventId}
            eventSubmitting={eventSubmitting}
            calendarNameById={calendarNameById}
            calendarColorById={calendarColorById}
            onClose={closeEventPanel}
            onFieldChange={handleEventFieldChange}
            onSubmit={handleEventSubmit}
            onEdit={handleEditEvent}
            onDelete={(id) => void handleDeleteEvent(id)}
          />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
