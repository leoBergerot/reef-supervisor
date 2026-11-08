import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      push(message, tone = "info") {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, message, tone }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== id));
        }, 6000);
      },
      dismiss(id) {
        setToasts((current) => current.filter((item) => item.id !== id));
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col items-stretch gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => api.dismiss(toast.id)}
            className={`pointer-events-auto max-w-lg rounded-2xl px-4 py-3 text-left text-sm shadow-lg ${
              toast.tone === "error"
                ? "bg-rose-700 text-white"
                :               toast.tone === "success"
                  ? "bg-emerald-700 text-white"
                  : toast.tone === "warning"
                    ? "bg-amber-600 text-white"
                    : "bg-ink text-white"
            }`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast");
  return context;
}
