import { motion as Motion } from "framer-motion";
import { useEffect, useRef } from "react";

// Simple focus-trap for bottom sheet
function useFocusTrap(ref, open, onClose) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first) first.focus();

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose && onClose();
      }
      if (e.key === 'Tab') {
        if (focusable.length === 0) return;
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last && last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first && first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [ref, open, onClose]);
}

export default function BottomSheet({ children, onClose, labelledById = 'bottom-sheet-title' }) {
  const ref = useRef(null);
  useFocusTrap(ref, true, onClose);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <Motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl text-black dark:text-white z-50 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
      >
        <div className="w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>

        {children}
      </Motion.div>
    </>
  );
}
