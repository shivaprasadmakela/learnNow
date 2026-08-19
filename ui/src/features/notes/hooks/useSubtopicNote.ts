import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchEntityNote, saveEntityNote } from '../api/notes.api';

export function useEntityNote(entityType: string = 'topic', entityId?: string | number, enabled: boolean = true) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isFirstRender = useRef(true);
    const lastSavedContent = useRef('');
    const idString = entityId ? String(entityId) : '';

    // Load note on entity change when enabled
    useEffect(() => {
        if (!idString || !enabled) {
            if (!idString) {
                setContent('');
                lastSavedContent.current = '';
                setSaveStatus('idle');
            }
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        isFirstRender.current = true;

        fetchEntityNote(entityType, idString)
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
    }, [entityType, idString, enabled]);

    // Manual Save action (only executed when user explicitly clicks Save button)
    const performSave = useCallback(async (textToSave: string) => {
        if (!idString) return;
        setSaveStatus('saving');
        try {
            await saveEntityNote(entityType, idString, textToSave);
            lastSavedContent.current = textToSave;
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }
    }, [entityType, idString]);

    const handleChange = (newContent: string) => {
        setContent(newContent);
        if (saveStatus === 'saved' || saveStatus === 'error') setSaveStatus('idle');
    };

    return {
        content,
        setContent: handleChange,
        isLoading,
        saveStatus,
        saveNow: () => performSave(content)
    };
}

export function useTopicNote(topicId?: string | number, enabled: boolean = true) {
    return useEntityNote('topic', topicId, enabled);
}

export function useSubtopicNote(subtopicId?: string | number, enabled: boolean = true) {
    return useEntityNote('subtopic', subtopicId, enabled);
}
