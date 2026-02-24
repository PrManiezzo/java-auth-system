import { useState, useCallback } from "react";
import type { Toast, ToastType } from "../components/Toast";

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = { id, type, title, message };
        setToasts((prev) => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback(
        (title: string, message?: string) => addToast("success", title, message),
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string) => addToast("error", title, message),
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => addToast("warning", title, message),
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string) => addToast("info", title, message),
        [addToast]
    );

    return {
        toasts,
        removeToast,
        success,
        error,
        warning,
        info,
    };
}
