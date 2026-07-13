
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}
