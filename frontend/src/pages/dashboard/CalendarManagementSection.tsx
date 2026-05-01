import type { Calendar, CalendarPayload } from '../../api/calendars';

interface CalendarManagementSectionProps {
  calendars: Calendar[];
  editingId: string | null;
  form: CalendarPayload;
  loading: boolean;
  submitting: boolean;
  error: string;
  successMessage: string;
  onFormChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEdit: (calendar: Calendar) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
}

const CalendarManagementSection = ({
  calendars,
  editingId,
  form,
  loading,
  submitting,
  error,
  successMessage,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
  onReset,
}: CalendarManagementSectionProps) => (
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
            onClick={onReset}
            className="text-sm text-secondary underline underline-offset-4"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-widest">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={onFormChange}
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
            onChange={onFormChange}
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
              onChange={onFormChange}
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
                    onClick={() => onEdit(calendar)}
                    className="px-4 py-2 border border-outline rounded-sm hover:bg-surface-container transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(calendar._id)}
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
);

export default CalendarManagementSection;
