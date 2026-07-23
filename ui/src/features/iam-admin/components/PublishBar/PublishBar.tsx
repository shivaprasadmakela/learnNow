import React from 'react';
import { Eye, Send, CheckCircle2 } from 'lucide-react';
import styles from './PublishBar.module.css';
import type { PublishBarProps } from './PublishBar.types';

export const PublishBar: React.FC<PublishBarProps> = ({
    status,
    version,
    onPreviewToggle,
    isPreviewActive,
    onPublish,
    isPublishing = false
}) => {
    return (
        <div className={styles.publishBar}>
            <div className={styles.statusGroup}>
                <span className={status === 'PUBLISHED' ? styles.badgePublished : styles.badgeDraft}>
                    {status}
                </span>
                <span className={styles.versionTag}>Version {version}</span>
            </div>

            <div className={styles.actionGroup}>
                <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={onPreviewToggle}
                >
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    {isPreviewActive ? 'Back to Editing' : 'Preview Content'}
                </button>

                <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={onPublish}
                    disabled={isPublishing}
                >
                    {status === 'PUBLISHED' ? (
                        <>
                            <CheckCircle2 size={16} style={{ marginRight: '6px' }} />
                            Published (v{version})
                        </>
                    ) : (
                        <>
                            <Send size={16} style={{ marginRight: '6px' }} />
                            Publish Content
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
