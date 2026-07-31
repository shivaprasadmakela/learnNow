import React from 'react';
import type { LanguageOption } from '../../constants/codeTemplates';
import styles from './LanguageSidebar.module.css';

interface LanguageSidebarProps {
    languages: LanguageOption[];
    selectedLanguage: LanguageOption;
    onSelectLanguage: (lang: LanguageOption) => void;
}

export const LanguageSidebar: React.FC<LanguageSidebarProps> = ({
    languages,
    selectedLanguage,
    onSelectLanguage
}) => {
    return (
        <aside className={styles.sidebar}>
            {languages.map((lang) => {
                const isActive = lang.id === selectedLanguage.id;
                return (
                    <button
                        key={lang.id}
                        type="button"
                        className={`${styles.tile} ${isActive ? styles.tileActive : ''}`}
                        onClick={() => onSelectLanguage(lang)}
                        title={lang.name}
                    >
                        <span className={styles.badgeText}>{lang.badgeLabel}</span>
                    </button>
                );
            })}
        </aside>
    );
};
