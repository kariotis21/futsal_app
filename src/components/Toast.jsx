import { useEffect } from "react";

export default function Toast({ message, onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  // allow message to be object: { text, actionLabel, onAction }
  const text = typeof message === 'string' ? message : message.text;
  const actionLabel = typeof message === 'object' ? message.actionLabel : null;
  const onAction = typeof message === 'object' ? message.onAction : null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                    bg-black text-white px-6 py-3 rounded-xl shadow-lg
                    text-lg animate-fade-in flex items-center gap-4">
      <div className="flex-1">{text}</div>
      {actionLabel && onAction && (
        <button
          className="bg-white text-black px-3 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={() => { onAction(); onClose(); }}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
