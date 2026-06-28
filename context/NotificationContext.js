"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

let counter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++counter;
      setToasts((list) => [...list, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = {
    notify,
    dismiss,
    toasts,
    success: (m) => notify(m, "success"),
    error: (m) => notify(m, "error", 6000),
    info: (m) => notify(m, "info"),
    warning: (m) => notify(m, "warning"),
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
