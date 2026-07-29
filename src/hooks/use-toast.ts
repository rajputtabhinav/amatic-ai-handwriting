import { useCallback, useState } from 'react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(({ title, description }: { title: string; description?: string }) => {
    const nextToast = {
      id: crypto.randomUUID(),
      title,
      description,
    };

    setToasts((current) => [...current, nextToast]);
    return nextToast;
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}
