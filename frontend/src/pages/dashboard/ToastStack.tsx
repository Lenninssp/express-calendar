interface Toast {
  id: number;
  message: string;
}

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const ToastStack = ({ toasts, onDismiss }: ToastStackProps) => (
  <div className="fixed top-5 right-5 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3 pointer-events-none">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className="pointer-events-auto rounded-lg border border-outline-variant bg-surface-bright/95 px-4 py-3 shadow-soft backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-on-surface">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-secondary"
          >
            Close
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default ToastStack;
