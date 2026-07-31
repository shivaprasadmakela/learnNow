import React from 'react';
import type { ConsoleLogEntry } from '../../hooks/useCodeExecution';
import styles from './CompilerOutputPane.module.css';

interface CompilerOutputPaneProps {
    logs: ConsoleLogEntry[];
    htmlPreview: string;
    stdin: string;
    onStdinChange: (val: string) => void;
    isHtml: boolean;
    activeTab?: 'input' | 'output';
    onClear?: () => void;
    executionTimeMs?: number | null;
}

export const CompilerOutputPane: React.FC<CompilerOutputPaneProps> = ({
    logs,
    htmlPreview,
    stdin,
    onStdinChange,
    isHtml,
    activeTab = 'output'
}) => {
    return (
        <div className={styles.outputContainer}>
            <div className={styles.contentArea}>
                {activeTab === 'input' ? (
                    <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b' }}>
                            Standard Input (stdin):
                        </p>
                        <textarea
                            className={styles.stdinTextarea}
                            value={stdin}
                            onChange={(e) => onStdinChange(e.target.value)}
                            placeholder="Enter stdin input data here..."
                        />
                    </div>
                ) : isHtml && htmlPreview ? (
                    <iframe
                        title="Live HTML Output Preview"
                        srcDoc={htmlPreview}
                        style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff', borderRadius: '6px' }}
                        sandbox="allow-scripts"
                    />
                ) : logs.length > 0 ? (
                    logs.map((log, idx) => (
                        <div
                            key={idx}
                            className={`${styles.logLine} ${
                                log.type === 'error' ? styles.logLineError : log.type === 'warn' ? styles.logLineWarn : ''
                            }`}
                        >
                            {log.message}
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        Click <strong>Run Code</strong> to execute program output.
                    </div>
                )}
            </div>
        </div>
    );
};
