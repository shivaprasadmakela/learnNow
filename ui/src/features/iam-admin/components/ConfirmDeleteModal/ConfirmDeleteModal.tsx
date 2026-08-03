import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './ConfirmDeleteModal.module.css';
import type { ConfirmDeleteModalProps } from './ConfirmDeleteModal.types';

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    title,
    description,
    isDeleting = false,
    onConfirm,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={28} />
                </div>
                <h3 className={styles.title}>Delete Course?</h3>
                <p className={styles.description}>
                    Are you sure you want to delete <span className={styles.highlightText}>"{title}"</span>?
                    {description || ' This action cannot be undone and will permanently remove all topics, subtopics, and quiz questions.'}
                </p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Deleting...' : 'Delete Course'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
