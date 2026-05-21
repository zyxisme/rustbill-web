import { useState, useEffect, useCallback, createElement } from "react";
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import type { ToastProps } from "@/components/ui/toast";

type ToastVariant = NonNullable<ToastProps["variant"]>;

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type Listener = (toasts: ToastItem[]) => void;

let count = 0;
const listeners: Listener[] = [];
let memory: ToastItem[] = [];

function emit() {
  for (const listener of listeners) {
    listener([...memory]);
  }
}

function addToast(props: Omit<ToastItem, "id">) {
  const id = String(++count);
  const toast: ToastItem = { id, ...props };
  memory = [...memory, toast];
  emit();

  setTimeout(() => {
    removeToast(id);
  }, 5000);

  return id;
}

function removeToast(id: string) {
  memory = memory.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const toast = useCallback(addToast, []);
  const dismiss = useCallback(removeToast, []);
  return { toast, dismiss };
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>(memory);

  useEffect(() => {
    const listener: Listener = (items) => setToasts(items);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  if (toasts.length === 0) return null;

  return createElement(
    "div",
    {
      className:
        "fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[320px]",
    },
    toasts.map((t) =>
      createElement(
        Toast,
        {
          key: t.id,
          variant: t.variant ?? "default",
          onClose: () => removeToast(t.id),
        },
        t.title && createElement(ToastTitle, null, t.title),
        t.description && createElement(ToastDescription, null, t.description),
      ),
    ),
  );
}
