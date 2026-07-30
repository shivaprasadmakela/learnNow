import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ConflictResolutionModalProps, ConflictStrategyOption } from './ConflictResolutionModal.types';
import styles from './ConflictResolutionModal.module.css';

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
    conflicts,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    const [selectedStrategy, setSelectedStrategy] = useState<ConflictStrategyOption>('OVERWRITE');

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerIcon}>
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h3 className={styles.headerTitle}>Duplicate Content Detected</h3>
                        <p className={styles.headerSubtitle}>
                            {conflicts.length} matching entity collision{conflicts.length > 1 ? 's' : ''} found in database.
                        </p>
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.conflictList}>
                        {conflicts.map((c, idx) => (
                            <div key={idx} className={styles.conflictItem}>
                                <span className={styles.levelTag}>{c.level}</span>
                                <span>{c.message}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Choose how to resolve conflicts:
                    </div>

                    <div className={styles.strategyOptions}>
                        <label
                            className={`${styles.strategyOption} ${selectedStrategy === 'OVERWRITE' ? styles.strategyOptionSelected : ''}`}
                        >
                            <input
                                type="radio"
                                name="conflictStrategy"
                                className={styles.radio}
                                checked={selectedStrategy === 'OVERWRITE'}
                                onChange={() => setSelectedStrategy('OVERWRITE')}
                            />
                            <div>
                                <p className={styles.strategyTitle}>🔄 Replace / Override Existing Content</p>
                                <p className={styles.strategyDesc}>Overwrites existing matching topics and subtopics with the imported version.</p>
                            </div>
                        </label>

                        <label
                            className={`${styles.strategyOption} ${selectedStrategy === 'SKIP_EXISTING' ? styles.strategyOptionSelected : ''}`}
                        >
                            <input
                                type="radio"
                                name="conflictStrategy"
                                className={styles.radio}
                                checked={selectedStrategy === 'SKIP_EXISTING'}
                                onChange={() => setSelectedStrategy('SKIP_EXISTING')}
                            />
                            <div>
                                <p className={styles.strategyTitle}>⏩ Skip Existing Duplicates</p>
                                <p className={styles.strategyDesc}>Keeps existing database content intact and imports only new non-colliding items.</p>
                            </div>
                        </label>

                        <label
                            className={`${styles.strategyOption} ${selectedStrategy === 'KEEP_BOTH' ? styles.strategyOptionSelected : ''}`}
                        >
                            <input
                                type="radio"
                                name="conflictStrategy"
                                className={styles.radio}
                                checked={selectedStrategy === 'KEEP_BOTH'}
                                onChange={() => setSelectedStrategy('KEEP_BOTH')}
                            />
                            <div>
                                <p className={styles.strategyTitle}>👯 Keep Both (Duplicate with Suffix)</p>
                                <p className={styles.strategyDesc}>Appends new entities alongside existing ones with a &quot;(Imported)&quot; title suffix.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.confirmBtn}
                        onClick={() => onConfirm(selectedStrategy)}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Proceed'}
                    </button>
                </div>
            </div>
        </div>
    );
};
