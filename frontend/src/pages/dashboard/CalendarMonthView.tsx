import type { Calendar } from '../../api/calendars';
import type { CalendarEvent } from '../../api/events';
import {
  formatDateKey,
  formatTimeLabel,
  getMonthGrid,
  getMonthLabel,
  WEEKDAY_LABELS,
} from './dateUtils';

interface CalendarMonthViewProps {
  calendars: Calendar[];
  selectedCalendarId: string;
  calendarViewDate: Date;
  eventsLoading: boolean;
  filteredEvents: CalendarEvent[];
  eventError: string;
  eventSuccessMessage: string;
  calendarColorById: Map<string, string>;
  onCalendarFilterChange: (value: string) => void;
  onPrevMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
  onCreateEvent: (calendarId?: string, date?: Date) => void;
  onOpenEvent: (id: string) => void;
}

const CalendarMonthView = ({
  calendars,
  selectedCalendarId,
  calendarViewDate,
  eventsLoading,
  filteredEvents,
  eventError,
  eventSuccessMessage,
  calendarColorById,
  onCalendarFilterChange,
  onPrevMonth,
  onToday,
  onNextMonth,
  onCreateEvent,
  onOpenEvent,
}: CalendarMonthViewProps) => {
  const eventsByDay = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = formatDateKey(new Date(event.start));

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(event);
    acc[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return acc;
  }, {});

  const monthGrid = getMonthGrid(calendarViewDate);
  const visibleMonth = calendarViewDate.getMonth();
  const todayKey = formatDateKey(new Date());

  return (
    <div className="bg-surface-bright border border-outline-variant p-6 md:p-8 rounded-lg shadow-soft">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-tertiary mb-2">Calendar View</p>
          <h2 className="text-2xl">{getMonthLabel(calendarViewDate)}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedCalendarId}
            onChange={(event) => onCalendarFilterChange(event.target.value)}
            className="form-input min-w-[210px]"
          >
            <option value="all">All calendars</option>
            {calendars.map((calendar) => (
              <option key={calendar._id} value={calendar._id}>
                {calendar.title}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              className="px-4 py-3 border border-outline rounded-sm hover:bg-surface-container transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-4 py-3 border border-outline rounded-sm hover:bg-surface-container transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="px-4 py-3 border border-outline rounded-sm hover:bg-surface-container transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {eventSuccessMessage && <p className="text-secondary text-sm italic mb-4">{eventSuccessMessage}</p>}
      {eventError && <p className="text-error text-sm italic mb-4">{eventError}</p>}

      {eventsLoading ? (
        <div className="h-56 border border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant">
          Loading events...
        </div>
      ) : calendars.length === 0 ? (
        <div className="h-56 border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center text-center px-6">
          <p className="text-lg text-primary mb-2">Create a calendar first.</p>
          <p className="text-on-surface-variant">
            Events need a calendar owner before they can appear in the month view.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant">
          <div className="grid grid-cols-7 bg-surface-container border-b border-outline-variant">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-7">
            {monthGrid.map((day) => {
              const dayKey = formatDateKey(day);
              const dayEvents = eventsByDay[dayKey] || [];
              const isCurrentMonth = day.getMonth() === visibleMonth;
              const isToday = dayKey === todayKey;

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => onCreateEvent(undefined, day)}
                  className={`min-h-[164px] border-b border-r border-outline-variant p-3 text-left transition-colors ${
                    isCurrentMonth ? 'bg-surface-bright hover:bg-surface-container/60' : 'bg-surface-dim/35 text-outline hover:bg-surface-container/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        isToday ? 'bg-primary text-white' : 'text-on-surface'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                      {dayEvents.length ? `${dayEvents.length} events` : 'Add'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event._id}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onOpenEvent(event._id);
                        }}
                        className="rounded-md px-3 py-2 text-sm shadow-sm"
                        style={{
                          backgroundColor: calendarColorById.get(event.calendarId) || '#4c5f7c',
                          color: '#fffdf8',
                        }}
                      >
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-xs opacity-90">{formatTimeLabel(event.start)}</p>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarMonthView;
