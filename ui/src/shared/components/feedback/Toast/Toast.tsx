import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastItem, ToastType, ToastContextType } from './Toast.types';
import styles from './Toast.module.css';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove toast after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={18} className={styles.iconSuccess} />;
            case 'error':
                return <XCircle size={18} className={styles.iconError} />;
            case 'warning':
                return <AlertTriangle size={18} className={styles.iconWarning} />;
            case 'info':
            default:
                return <Info size={18} className={styles.iconInfo} />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${styles.toastItem} ${styles[toast.type]}`}
                        onClick={() => removeToast(toast.id)}
                    >
                        <span className={styles.toastIcon}>
                            {getIcon(toast.type)}
                        </span>
                        <p className={styles.toastMessage}>{toast.message}</p>
                        <button className={styles.closeBtn} aria-label="Close">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
