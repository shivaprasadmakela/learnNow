import React from 'react';
import { Terminal, X } from 'lucide-react';
import { CodePlayground } from '../../../../shared/components/code-playground';
import styles from './PlaygroundSidePanel.module.css';

interface PlaygroundSidePanelProps {
    isOpen: boolean;
    initialCode: string;
    language: string;
    onClose: () => void;
    onOpenFullCompiler?: (code: string, language: string) => void;
}

/**
 * The study console's playground: the shared CodePlayground in a panel that slides over the
 * lesson, so code can be tried without losing the reader's place.
 */
export const PlaygroundSidePanel: React.FC<PlaygroundSidePanelProps> = ({
    isOpen,
    initialCode,
    language,
    onClose,
    onOpenFullCompiler
}) => (
    <aside
        className={`${styles.playgroundSideSlider} ${isOpen ? styles.playgroundSideSliderOpen : ''}`}
        aria-label="Code playground"
        aria-hidden={!isOpen}
    >
        <div className={styles.header}>
            <div className={styles.headerTitle}>
                <Terminal size={18} aria-hidden="true" />
                <span>Code Playground</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} title="Close playground">
                <X size={16} aria-hidden="true" />
            </button>
        </div>

        {/* Keyed by the code, so opening another block starts fresh rather than keeping edits. */}
        {isOpen && (
            <div className={styles.body}>
                <CodePlayground
                    key={`${language}:${initialCode}`}
                    initialCode={initialCode}
                    language={language}
                    title="Playground"
                    onOpenFullEditor={onOpenFullCompiler}
                    layout="fill"
                />
            </div>
        )}
    </aside>
);
