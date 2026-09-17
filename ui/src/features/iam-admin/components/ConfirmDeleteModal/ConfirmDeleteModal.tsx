import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './ConfirmDeleteModal.module.css';
import { Modal } from '../../../../shared/components/ui/Modal';
import type { ConfirmDeleteModalProps } from './ConfirmDeleteModal.types';

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    title,
    entityLabel = 'course',
    description,
    isDeleting = false,
    onConfirm,
    onClose
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        ariaLabel={`Delete ${entityLabel}`}
        // No header: the icon and heading below are the dialog's own, and a second header bar
        // above them reads as two competing titles.
        bodyClassName={styles.body}
    >
        <div className={styles.iconWrapper}>
            <AlertTriangle size={28} />
        </div>
        <h3 className={styles.title}>Delete {entityLabel}?</h3>
        <p className={styles.description}>
            Are you sure you want to delete <span className={styles.highlightText}>"{title}"</span>?
            {description ??
                ` This cannot be undone and permanently removes everything inside the ${entityLabel}.`}
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
                {isDeleting ? 'Deleting...' : `Delete ${entityLabel}`}
            </button>
        </div>
    </Modal>
);

export default ConfirmDeleteModal;
