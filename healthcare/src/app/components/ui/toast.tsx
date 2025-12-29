'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Convenience methods
    const success = (message: string, duration?: number) => addToast(message, 'success', duration);
    const error = (message: string, duration?: number) => addToast(message, 'error', duration);
    const warning = (message: string, duration?: number) => addToast(message, 'warning', duration);
    const info = (message: string, duration?: number) => addToast(message, 'info', duration);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info
    };
};

export const ToastContainer = ({ toasts, removeToast }: {
    toasts: Toast[],
    removeToast: (id: string) => void
}) => {
    useEffect(() => {
        toasts.forEach(toast => {
            if (toast.duration) {
                const timer = setTimeout(() => {
                    removeToast(toast.id);
                }, toast.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [toasts, removeToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5" />;
            case 'error':
            case 'warning':
                return <AlertTriangle className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const getBackgroundColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'info':
                return 'bg-blue-500';
            default:
                return 'bg-gray-700';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`${getBackgroundColor(toast.type)} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between min-w-[300px] max-w-md animate-slideIn`}
                >
                    <div className="flex items-center">
                        {getIcon(toast.type)}
                        <span className="ml-2">{toast.message}</span>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-white hover:text-gray-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};
