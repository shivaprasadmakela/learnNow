import React, { useState } from 'react';
import { RotateCcw, Maximize2, Share2, Check, LogIn, LogOut, Sparkles } from 'lucide-react';
import type { LanguageOption } from '../../constants/codeTemplates';
import styles from './CompilerHeader.module.css';

interface CompilerHeaderProps {
    languages: LanguageOption[];
    selectedLanguage: LanguageOption;
    onSelectLanguage: (lang: LanguageOption) => void;
    onRun: () => void;
    onReset: () => void;
    onFormat?: () => void;
    onShare?: () => Promise<string>;
    isRunning: boolean;
    activeTab: 'input' | 'output';
    onTabChange: (tab: 'input' | 'output') => void;
}

export const CompilerHeader: React.FC<CompilerHeaderProps> = ({
    languages,
    selectedLanguage,
    onSelectLanguage,
    onRun,
    onReset,
    onFormat,
    onShare,
    isRunning,
    activeTab,
    onTabChange
}) => {
    const [isShared, setIsShared] = useState(false);

    const handleShareClick = async () => {
        if (onShare) {
            const url = await onShare();
            if (!url) return;
        } else {
            await navigator.clipboard.writeText(window.location.href);
        }
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    return (
        <header className={styles.headerGrid}>
            <div className={styles.leftHeader}>
                <div className={styles.brandGroup}>
                    <select
                        className={styles.langSelect}
                        value={selectedLanguage.id}
                        onChange={(e) => {
                            const match = languages.find(l => l.id === e.target.value);
                            if (match) onSelectLanguage(match);
                        }}
                        title="Select programming language"
                    >
                        {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <div className={styles.title}>
                        Online Compiler
                    </div>
                </div>

                <div className={styles.toolGroup}>
                    {onFormat && (
                        <button type="button" className={styles.iconBtn} onClick={onFormat} title="Prettify / Format Code (Shift + Alt + F)">
                            <Sparkles size={16} />
                        </button>
                    )}
                    <button type="button" className={styles.iconBtn} onClick={onReset} title="Reset Code Template">
                        <RotateCcw size={16} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={toggleFullscreen} title="Toggle Fullscreen">
                        <Maximize2 size={16} />
                    </button>
                    <button type="button" className={styles.shareBtn} onClick={handleShareClick} title="Share Code Link">
                        {isShared ? <Check size={14} /> : <Share2 size={14} />}
                        {isShared ? 'Link Copied!' : 'Share Code'}
                    </button>
                    <button
                        type="button"
                        className={styles.runBtn}
                        onClick={onRun}
                        disabled={isRunning}
                        title="Run Code (Ctrl + Enter)"
                    >
                        {isRunning ? 'Running…' : 'Run Code'}
                    </button>
                </div>
            </div>

            <div className={styles.rightHeader}>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === 'input' ? styles.tabBtnActive : ''}`}
                    onClick={() => onTabChange('input')}
                >
                    <LogIn size={15} /> Input
                </button>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === 'output' ? styles.tabBtnActive : ''}`}
                    onClick={() => onTabChange('output')}
                >
                    <LogOut size={15} /> Output
                </button>
            </div>
        </header>
    );
};
