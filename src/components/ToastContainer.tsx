import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToToasts } from '../lib/toast';

interface Toast {
  id: number;
  message: string;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => removeToast(id), 4000);
    });
    return unsubscribe;
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm animate-[slideIn_0.2s_ease-out]"
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
