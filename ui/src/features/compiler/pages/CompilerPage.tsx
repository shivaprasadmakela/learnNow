import React, { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants/codeTemplates';
import type { LanguageOption } from '../constants/codeTemplates';
import { CompilerHeader } from '../components/CompilerHeader/CompilerHeader';
import { MonacoEditorPane } from '../components/MonacoEditorPane/MonacoEditorPane';
import { CompilerOutputPane } from '../components/CompilerOutputPane/CompilerOutputPane';
import { useCodeExecution } from '../hooks/useCodeExecution';
import { shareSnippetApi, fetchSharedSnippetApi } from '../../../shared/api/compiler.api';
import styles from './CompilerPage.module.css';

export const CompilerPage: React.FC = () => {
    const getInitialLanguage = (): LanguageOption => {
        if (typeof window !== 'undefined') {
            const parts = window.location.pathname.split('/').filter(Boolean);
            if (parts.length >= 2 && parts[0] === 'compiler') {
                const langSlug = parts[1].toLowerCase();
                const match = SUPPORTED_LANGUAGES.find(l => l.id === langSlug || l.monacoLanguage === langSlug);
                if (match) return match;
            }
        }
        return SUPPORTED_LANGUAGES[0];
    };

    const getInitialCode = (lang: LanguageOption): string => {
        if (typeof window !== 'undefined') {
            const savedDraft = localStorage.getItem(`compiler_draft_${lang.id}`);
            if (savedDraft) return savedDraft;
        }
        return lang.defaultCode;
    };

    const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(getInitialLanguage);
    const [code, setCode] = useState<string>(() => getInitialCode(getInitialLanguage()));
    const [stdin, setStdin] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');

    const { logs, htmlPreview, isRunning, runCode, clearConsole } = useCodeExecution();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const searchParams = new URLSearchParams(window.location.search);
        const shortId = searchParams.get('s') || searchParams.get('snippet');

        if (shortId) {
            fetchSharedSnippetApi(shortId)
                .then((snippet) => {
                    if (snippet && snippet.code) {
                        const langMatch = SUPPORTED_LANGUAGES.find(
                            l => l.id === snippet.language || l.monacoLanguage === snippet.language
                        );
                        if (langMatch) {
                            setSelectedLanguage(langMatch);
                        }
                        setCode(snippet.code);
                    }
                })
                .catch(() => {
                    // Fallback to default draft if short link not found
                });
        }
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            const lang = getInitialLanguage();
            setSelectedLanguage(lang);
            setCode(getInitialCode(lang));
            clearConsole();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`compiler_draft_${selectedLanguage.id}`, newCode);
        }
    }, [selectedLanguage.id]);

    const handleSelectLanguage = (lang: LanguageOption) => {
        setSelectedLanguage(lang);
        const restoredCode = getInitialCode(lang);
        setCode(restoredCode);
        clearConsole();
        if (typeof window !== 'undefined') {
            window.history.pushState(null, '', `/compiler/${lang.id}`);
        }
    };

    const handleReset = () => {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`compiler_draft_${selectedLanguage.id}`);
        }
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(null, '', `/compiler/${selectedLanguage.id}`);
        }
        setCode(selectedLanguage.defaultCode);
        clearConsole();
    };

    const handleShare = async (): Promise<string> => {
        try {
            const response = await shareSnippetApi({
                language: selectedLanguage.id,
                code
            });
            const shareUrl = `${window.location.origin}/compiler/${selectedLanguage.id}?s=${response.shortId}`;
            await navigator.clipboard.writeText(shareUrl);
            return shareUrl;
        } catch {
            const shareUrl = window.location.href;
            await navigator.clipboard.writeText(shareUrl);
            return shareUrl;
        }
    };

    const handleRun = () => {
        setActiveTab('output');
        runCode(code, selectedLanguage.monacoLanguage, stdin);
    };

    return (
        <div className={styles.pageLayout}>
            <CompilerHeader
                languages={SUPPORTED_LANGUAGES}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={handleSelectLanguage}
                onRun={handleRun}
                onReset={handleReset}
                onShare={handleShare}
                isRunning={isRunning}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <main className={styles.splitEditorOutput}>
                <MonacoEditorPane
                    code={code}
                    language={selectedLanguage.monacoLanguage}
                    onChange={handleCodeChange}
                    onRun={handleRun}
                />
                <CompilerOutputPane
                    logs={logs}
                    htmlPreview={htmlPreview}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    isHtml={selectedLanguage.monacoLanguage === 'html'}
                    activeTab={activeTab}
                />
            </main>
        </div>
    );
};
