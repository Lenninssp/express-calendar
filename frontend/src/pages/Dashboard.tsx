import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { calendarService, type Calendar, type CalendarPayload } from '../api/calendars';
import { eventService, type CalendarEvent, type EventPayload } from '../api/events';

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

const formatDateTimeInput = (value: string) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

const formatDateTimeLabel = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState<CalendarPayload>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [eventForm, setEventForm] = useState<EventPayload>(DEFAULT_EVENT_FORM);
  const [eventPanelOpen, setEventPanelOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState<CalendarEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState('');
  const [eventSuccessMessage, setEventSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
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

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
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

  const resetEventForm = (calendarId?: string) => {
    const nextCalendarId =
      calendarId ?? (selectedCalendarId !== 'all' ? selectedCalendarId : calendars[0]?._id || '');

    setEventForm({
      ...DEFAULT_EVENT_FORM,
      calendarId: nextCalendarId,
    });
    setEditingEventId(null);
    setEventDetails(null);
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

      if (editingId === id) {
        resetForm();
      }

      setSuccessMessage('Calendar deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete calendar');
    }
  };

  const openCreateEventPanel = (calendarId?: string) => {
    resetEventForm(calendarId);
    setEventError('');
    setEventSuccessMessage('');
    setEventPanelOpen(true);
  };

  const handleEventClick = async (id: string) => {
    setEventError('');
    setEventSuccessMessage('');
    setEventPanelOpen(true);

    try {
      const data = await eventService.getById(id);
      setEventDetails(data);
      setEditingEventId(null);
      setEventForm({
        title: data.title,
        description: data.description || '',
        start: formatDateTimeInput(data.start),
        end: formatDateTimeInput(data.end),
        location: data.location || '',
        calendarId: data.calendarId,
      });
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Unable to fetch event details');
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event._id);
    setEventDetails(event);
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
        setEventDetails(updatedEvent);
        setEventSuccessMessage('Event updated.');
      } else {
        const newEvent = await eventService.create(eventForm);
        setEvents((current) =>
          [...current, newEvent].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
          ),
        );
        setEventDetails(newEvent);
        setEditingEventId(newEvent._id);
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
      resetEventForm();
      setEventPanelOpen(false);
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
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] mb-6">
          <div className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-tertiary mb-2">
                  {editingId ? 'Edit calendar' : 'Create calendar'}
                </p>
                <h2 className="text-2xl">
                  {editingId ? 'Update details' : 'New calendar'}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-secondary underline underline-offset-4"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Work, Personal, Family"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  className="form-input resize-none"
                  placeholder="What this calendar is for"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="h-12 w-16 rounded-sm border border-outline-variant bg-surface-container cursor-pointer"
                  />
                  <span className="text-sm text-on-surface-variant">{form.color}</span>
                </div>
              </div>

              {error && <p className="text-error text-sm italic">{error}</p>}
              {successMessage && <p className="text-secondary text-sm italic">{successMessage}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting
                  ? editingId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Calendar'}
              </button>
            </form>
          </div>

          <div className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary mb-2">Collection</p>
                <h2 className="text-2xl">Manage multiple calendars</h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                {calendars.length} {calendars.length === 1 ? 'calendar' : 'calendars'}
              </p>
            </div>

            {loading ? (
              <div className="h-48 border border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant">
                Loading calendars...
              </div>
            ) : calendars.length === 0 ? (
              <div className="h-48 border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center text-center px-6">
                <p className="text-lg text-primary mb-2">No calendars yet.</p>
                <p className="text-on-surface-variant">
                  Create your first calendar to start organizing separate schedules.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {calendars.map((calendar) => (
                  <article
                    key={calendar._id}
                    className="border border-outline-variant rounded-lg p-5 bg-surface/60"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: calendar.color }}
                          />
                          <h3 className="text-xl break-words">{calendar.title}</h3>
                        </div>
                        <p className="text-on-surface-variant mb-3 whitespace-pre-wrap">
                          {calendar.description || 'No description provided.'}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-outline">
                          Updated {new Date(calendar.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-3 md:shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(calendar)}
                          className="px-4 py-2 border border-outline rounded-sm hover:bg-surface-container transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(calendar._id)}
                          className="px-4 py-2 border border-tertiary text-tertiary rounded-sm hover:bg-[#f7e5df] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-tertiary mb-2">Events</p>
                <h2 className="text-2xl">Calendar schedule</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={selectedCalendarId}
                  onChange={(event) => setSelectedCalendarId(event.target.value)}
                  className="form-input min-w-[210px]"
                >
                  <option value="all">All calendars</option>
                  {calendars.map((calendar) => (
                    <option key={calendar._id} value={calendar._id}>
                      {calendar.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => openCreateEventPanel()}
                  disabled={calendars.length === 0}
                  className="btn-primary sm:w-auto sm:px-6 sm:mt-0 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  New Event
                </button>
              </div>
            </div>

            {eventSuccessMessage && <p className="text-secondary text-sm italic mb-4">{eventSuccessMessage}</p>}
            {eventError && <p className="text-error text-sm italic mb-4">{eventError}</p>}

            {eventsLoading ? (
              <div className="h-48 border border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="h-56 border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center text-center px-6">
                <p className="text-lg text-primary mb-2">No events yet.</p>
                <p className="text-on-surface-variant mb-5">
                  Create events from this screen and assign them to any calendar you manage.
                </p>
                <button
                  type="button"
                  onClick={() => openCreateEventPanel()}
                  disabled={calendars.length === 0}
                  className="px-5 py-3 border border-outline rounded-sm hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Create first event
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEvents.map((event) => (
                  <article
                    key={event._id}
                    className="border border-outline-variant rounded-lg p-5 bg-surface/60 cursor-pointer transition-colors hover:bg-surface-container"
                    onClick={() => void handleEventClick(event._id)}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: calendarColorById.get(event.calendarId) || '#4c5f7c' }}
                          />
                          <h3 className="text-xl break-words">{event.title}</h3>
                        </div>
                        <p className="text-sm uppercase tracking-[0.2em] text-outline mb-2">
                          {calendarNameById.get(event.calendarId) || 'Unassigned calendar'}
                        </p>
                        <p className="text-on-surface-variant mb-3 whitespace-pre-wrap">
                          {event.description || 'No description provided.'}
                        </p>
                        <div className="flex flex-col gap-1 text-sm text-on-surface-variant">
                          <span>{formatDateTimeLabel(event.start)}</span>
                          <span>to {formatDateTimeLabel(event.end)}</span>
                          <span>{event.location || 'No location set'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          handleEditEvent(event);
                          setEventPanelOpen(true);
                        }}
                        className="px-4 py-2 border border-outline rounded-sm hover:bg-surface-container transition-colors md:shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft h-fit">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary mb-2">
                  {eventPanelOpen ? 'Event editor' : 'Event details'}
                </p>
                <h2 className="text-2xl">
                  {editingEventId
                    ? 'Edit event'
                    : eventPanelOpen
                      ? 'Create event'
                      : 'Select an event'}
                </h2>
              </div>
              {eventPanelOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setEventPanelOpen(false);
                    resetEventForm();
                    setEventError('');
                  }}
                  className="text-sm text-secondary underline underline-offset-4"
                >
                  Close
                </button>
              )}
            </div>

            {!eventPanelOpen && !eventDetails ? (
              <div className="border border-dashed border-outline-variant rounded-lg p-6 text-on-surface-variant">
                Open an existing event to review its details, or create a new one from the schedule list.
              </div>
            ) : (
              <form onSubmit={handleEventSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={eventForm.title}
                    onChange={handleEventFieldChange}
                    className="form-input"
                    placeholder="Planning session"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={eventForm.description}
                    onChange={handleEventFieldChange}
                    className="form-input resize-none"
                    placeholder="Agenda, notes, or prep details"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                    Calendar
                  </label>
                  <select
                    name="calendarId"
                    required
                    value={eventForm.calendarId}
                    onChange={handleEventFieldChange}
                    className="form-input"
                  >
                    <option value="" disabled>Select a calendar</option>
                    {calendars.map((calendar) => (
                      <option key={calendar._id} value={calendar._id}>
                        {calendar.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                      Start time
                    </label>
                    <input
                      type="datetime-local"
                      name="start"
                      required
                      value={eventForm.start}
                      onChange={handleEventFieldChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                      End time
                    </label>
                    <input
                      type="datetime-local"
                      name="end"
                      required
                      value={eventForm.end}
                      onChange={handleEventFieldChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={eventForm.location}
                    onChange={handleEventFieldChange}
                    className="form-input"
                    placeholder="Conference room A or Zoom"
                  />
                </div>

                {eventDetails && (
                  <div className="rounded-lg border border-outline-variant bg-surface-container/70 p-4 text-sm text-on-surface-variant">
                    <p className="mb-1"><span className="font-semibold text-primary">Created:</span> {formatDateTimeLabel(eventDetails.createdAt)}</p>
                    <p><span className="font-semibold text-primary">Last updated:</span> {formatDateTimeLabel(eventDetails.updatedAt)}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="btn-primary"
                >
                  {eventSubmitting
                    ? editingEventId
                      ? 'Saving...'
                      : 'Creating...'
                    : editingEventId
                      ? 'Save Event'
                      : 'Create Event'}
                </button>

                {editingEventId && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteEvent(editingEventId)}
                    className="w-full p-3.5 border border-tertiary text-tertiary rounded-sm font-semibold transition-colors hover:bg-[#f7e5df]"
                  >
                    Delete Event
                  </button>
                )}
              </form>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
