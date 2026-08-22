import { useState, useEffect, useCallback } from 'react';
import { fetchTopicNote, saveTopicNote } from '../api/notes.api';

export function useTopicNote(topicId?: string | number, enabled: boolean = true) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const idString = topicId ? String(topicId) : '';

    // Load the note on topic change when enabled
    useEffect(() => {
        if (!idString || !enabled) {
            if (!idString) {
                setContent('');
                setSaveStatus('idle');
            }
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        fetchTopicNote(idString)
            .then(note => {
                if (isMounted) {
                    setContent(note.content || '');
                    setSaveStatus('idle');
                }
            })
            .catch(() => {
                if (isMounted) setContent('');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [idString, enabled]);

    // Only ever called from the panel's Save button; notes are not autosaved.
    const performSave = useCallback(async (textToSave: string) => {
        if (!idString) return;
        setSaveStatus('saving');
        try {
            await saveTopicNote(idString, textToSave);
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }
    }, [idString]);

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
