import { useState, useEffect, useCallback } from 'react';
import { fetchNote, saveNote, type NoteTarget } from '../api/notes.api';

export type NoteSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * One learner note, loaded and saved.
 *
 * Was `useTopicNote`, hardwired to topics. Generalising it meant the DSA workspace stopped
 * re-implementing the same load-edit-save-status cycle in a component of its own.
 *
 * Notes are never autosaved: `saveNow` is only ever called from an explicit Save. Autosaving a
 * textarea someone is mid-thought in produces a lot of write traffic and the occasional saved
 * half-sentence.
 */
export function useNote(
    target: NoteTarget,
    targetId?: string | number,
    enabled: boolean = true
) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
    const idString = targetId ? String(targetId) : '';

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

        fetchNote(target, idString)
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
    }, [target, idString, enabled]);

    const performSave = useCallback(
        async (textToSave: string) => {
            if (!idString) return;
            setSaveStatus('saving');
            try {
                await saveNote(target, idString, textToSave);
                setSaveStatus('saved');
            } catch {
                setSaveStatus('error');
            }
        },
        [target, idString]
    );

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
