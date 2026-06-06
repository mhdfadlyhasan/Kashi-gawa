type ToastListener = (message: string) => void;

let listeners: ToastListener[] = [];

export function showToast(message: string) {
  listeners.forEach((l) => l(message));
}

export function subscribeToToasts(listener: ToastListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
