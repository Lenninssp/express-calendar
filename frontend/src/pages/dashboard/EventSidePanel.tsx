import type { Calendar } from '../../api/calendars';
import type { CalendarEvent, EventPayload } from '../../api/events';
import { formatDateTimeLabel } from './dateUtils';
import type { EventPanelMode } from './types';

interface EventSidePanelProps {
  calendars: Calendar[];
  eventForm: EventPayload;
  eventPanelMode: EventPanelMode;
  selectedEvent: CalendarEvent | null;
  editingEventId: string | null;
  eventSubmitting: boolean;
  calendarNameById: Map<string, string>;
  calendarColorById: Map<string, string>;
  onClose: () => void;
  onFieldChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

const EventSidePanel = ({
  calendars,
  eventForm,
  eventPanelMode,
  selectedEvent,
  editingEventId,
  eventSubmitting,
  calendarNameById,
  calendarColorById,
  onClose,
  onFieldChange,
  onSubmit,
  onEdit,
  onDelete,
}: EventSidePanelProps) => (
  <aside className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft h-fit">
    <div className="flex items-start justify-between gap-3 mb-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-secondary mb-2">
          {eventPanelMode === 'create'
            ? 'New event'
            : eventPanelMode === 'edit'
              ? 'Edit event'
              : eventPanelMode === 'view'
                ? 'Event details'
                : 'Event details'}
        </p>
        <h2 className="text-2xl">
          {eventPanelMode === 'create'
            ? 'Create event'
            : eventPanelMode === 'edit'
              ? 'Update event'
              : eventPanelMode === 'view'
                ? selectedEvent?.title || 'Event details'
                : 'Select a day'}
        </h2>
      </div>
      {eventPanelMode !== 'closed' && (
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-secondary underline underline-offset-4"
        >
          Close
        </button>
      )}
    </div>

    {eventPanelMode === 'closed' ? (
      <div className="border border-dashed border-outline-variant rounded-lg p-6 text-on-surface-variant">
        Click any day in the month view to create an event, or click an event chip to inspect its details.
      </div>
    ) : eventPanelMode === 'view' && selectedEvent ? (
      <div className="space-y-5">
        <div className="rounded-lg border border-outline-variant bg-surface-container/70 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: calendarColorById.get(selectedEvent.calendarId) || '#4c5f7c' }}
            />
            <p className="text-sm uppercase tracking-[0.2em] text-on-surface-variant">
              {calendarNameById.get(selectedEvent.calendarId) || 'Calendar'}
            </p>
          </div>
          <p className="text-on-surface-variant whitespace-pre-wrap">
            {selectedEvent.description || 'No description provided.'}
          </p>
        </div>

        <div className="space-y-3 text-sm text-on-surface-variant">
          <p><span className="font-semibold text-primary">Starts:</span> {formatDateTimeLabel(selectedEvent.start)}</p>
          <p><span className="font-semibold text-primary">Ends:</span> {formatDateTimeLabel(selectedEvent.end)}</p>
          <p><span className="font-semibold text-primary">Location:</span> {selectedEvent.location || 'No location set'}</p>
          <p><span className="font-semibold text-primary">Created:</span> {formatDateTimeLabel(selectedEvent.createdAt)}</p>
          <p><span className="font-semibold text-primary">Updated:</span> {formatDateTimeLabel(selectedEvent.updatedAt)}</p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onEdit(selectedEvent)}
            className="btn-primary"
          >
            Edit Event
          </button>
          <button
            type="button"
            onClick={() => onDelete(selectedEvent._id)}
            className="w-full p-3.5 border border-tertiary text-tertiary rounded-sm font-semibold transition-colors hover:bg-[#f7e5df]"
          >
            Delete Event
          </button>
        </div>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            value={eventForm.title}
            onChange={onFieldChange}
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
            onChange={onFieldChange}
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
            onChange={onFieldChange}
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
              onChange={onFieldChange}
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
              onChange={onFieldChange}
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
            onChange={onFieldChange}
            className="form-input"
            placeholder="Conference room A or Zoom"
          />
        </div>

        <button
          type="submit"
          disabled={eventSubmitting}
          className="btn-primary"
        >
          {eventSubmitting
            ? eventPanelMode === 'edit'
              ? 'Saving...'
              : 'Creating...'
            : eventPanelMode === 'edit'
              ? 'Save Event'
              : 'Create Event'}
        </button>

        {eventPanelMode === 'edit' && editingEventId && (
          <button
            type="button"
            onClick={() => onDelete(editingEventId)}
            className="w-full p-3.5 border border-tertiary text-tertiary rounded-sm font-semibold transition-colors hover:bg-[#f7e5df]"
          >
            Delete Event
          </button>
        )}
      </form>
    )}
  </aside>
);

export default EventSidePanel;
