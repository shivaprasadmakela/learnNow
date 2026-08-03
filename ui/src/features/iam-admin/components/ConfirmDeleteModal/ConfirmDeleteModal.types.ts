export interface ConfirmDeleteModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    isDeleting?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}
