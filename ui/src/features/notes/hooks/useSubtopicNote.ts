import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSubtopicNote, saveSubtopicNote } from '../api/notes.api';

export function useSubtopicNote(subtopicId?: string | number) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isFirstRender = useRef(true);
    const lastSavedContent = useRef('');
    const idString = subtopicId ? String(subtopicId) : '';

    // Load note on subtopic change
    useEffect(() => {
        if (!idString) {
            setContent('');
            lastSavedContent.current = '';
            setSaveStatus('idle');
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        isFirstRender.current = true;

        fetchSubtopicNote(idString)
            .then(note => {
                if (isMounted) {
                    const loadedText = note.content || '';
                    setContent(loadedText);
                    lastSavedContent.current = loadedText;
                    setSaveStatus('idle');
                }
            })
            .catch(() => {
                if (isMounted) {
                    setContent('');
                    lastSavedContent.current = '';
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                    setTimeout(() => {
                        isFirstRender.current = false;
                    }, 100);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [idString]);

    // Save action
    const performSave = useCallback(async (textToSave: string) => {
        if (!idString || textToSave === lastSavedContent.current) return;
        setSaveStatus('saving');
        try {
            await saveSubtopicNote(idString, textToSave);
            lastSavedContent.current = textToSave;
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }
    }, [idString]);

    // 1.5s debounced auto-save effect
    useEffect(() => {
        if (isFirstRender.current || isLoading || !idString) return;
        if (content === lastSavedContent.current) return;

        const timer = setTimeout(() => {
            performSave(content);
        }, 1500);

        return () => clearTimeout(timer);
    }, [content, isLoading, idString, performSave]);

    const handleChange = (newContent: string) => {
        setContent(newContent);
        if (saveStatus === 'saved') setSaveStatus('idle');
    };

    return {
        content,
        setContent: handleChange,
        isLoading,
        saveStatus,
        saveNow: () => performSave(content)
    };
}
