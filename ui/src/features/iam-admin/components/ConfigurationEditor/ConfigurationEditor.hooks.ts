import { useState, useEffect, useCallback } from 'react';
import {
    fetchAdminPathById,
    saveAdminPath,
    type AdminPathData,
    type AdminTopicData,
    type AdminSubtopicData,
} from '../../api/admin.api';
import { useToast } from '../../../../shared/components/feedback/Toast';

export interface UseConfigurationEditorReturn {
    isLoading: boolean;
    isSaving: boolean;
    title: string;
    setTitle: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    managedBy: string;
    setManagedBy: (v: string) => void;
    status: 'DRAFT' | 'PUBLISHED';
    topics: AdminTopicData[];
    activeTopicIndex: number;
    setActiveTopicIndex: (i: number) => void;
    activeSubtopicIndex: number;
    setActiveSubtopicIndex: (i: number) => void;
    handleAddTopic: (customTopic?: AdminTopicData) => void;
    handleAddTopicFromJson: (jsonInput: string) => boolean;
    handleMoveTopicUp: (index: number) => void;
    handleMoveTopicDown: (index: number) => void;
    handleAttachExistingTopic: (topic: AdminTopicData) => void;
    handleRemoveTopic: (index: number) => void;
    handleUpdateTopic: (index: number, field: keyof AdminTopicData, value: string) => void;
    handleAddSubtopic: (topicIndex: number) => void;
    handleRemoveSubtopic: (topicIndex: number, subtopicIndex: number) => void;
    handleUpdateSubtopic: (topicIndex: number, subtopicIndex: number, field: keyof AdminSubtopicData, value: string) => void;
    handleAddQuestion: (topicIndex: number, subtopicIndex: number) => void;
    handleRemoveQuestion: (topicIndex: number, subtopicIndex: number, questionIndex: number) => void;
    handleUpdateQuestion: (topicIndex: number, subtopicIndex: number, questionIndex: number, field: keyof import('../../api/admin.api').QuizQuestionDto, value: any) => void;
    handleAddOption: (topicIndex: number, subtopicIndex: number, questionIndex: number) => void;
    handleRemoveOption: (topicIndex: number, subtopicIndex: number, questionIndex: number, optionIndex: number) => void;
    handleUpdateOption: (topicIndex: number, subtopicIndex: number, questionIndex: number, optionIndex: number, value: string) => void;
    handleSaveDraft: () => Promise<void>;
    handlePublish: () => Promise<void>;
}

export const useConfigurationEditor = (
    pathId: string | null | undefined,
    onSaveSuccess: () => void,
): UseConfigurationEditorReturn => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState<boolean>(!!pathId);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<string>('Backend');
    const [managedBy, setManagedBy] = useState<string>('learnNow');
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
    const [topics, setTopics] = useState<AdminTopicData[]>([]);
    const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
    const [activeSubtopicIndex, setActiveSubtopicIndex] = useState<number>(0);

    useEffect(() => {
        if (!pathId) return;
        fetchAdminPathById(pathId)
            .then((data: AdminPathData) => {
                setTitle(data.title || '');
                setDescription(data.description || '');
                setCategory(data.category || 'Backend');
                setManagedBy(data.managedBy || 'learnNow');
                setStatus(data.status || 'DRAFT');
                setTopics(data.topics || []);
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                console.error('Failed to load path', err);
                showToast('Failed to load path data', 'error');
                setIsLoading(false);
            });
    }, [pathId, showToast]);

    // Warn user before reloading/leaving while in Configuration Editor
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes in your course configuration. Are you sure you want to leave?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleAddTopic = useCallback((customTopic?: AdminTopicData) => {
        const newTopic: AdminTopicData = customTopic ? {
            ...customTopic,
            orderIndex: topics.length + 1
        } : {
            title: `New Topic ${topics.length + 1}`,
            description: 'Topic overview and learning goals.',
            category: 'Topic',
            duration: '2 hours',
            orderIndex: topics.length + 1,
            status: 'DRAFT',
            subtopics: [{
                title: 'Introduction & Overview',
                content: '### Section Overview\n\nAdd section content and details here.',
                orderIndex: 1,
                status: 'DRAFT',
            }],
        };
        setTopics(prev => [...prev, newTopic]);
        setActiveTopicIndex(topics.length);
        setActiveSubtopicIndex(0);
    }, [topics]);

    const handleAddTopicFromJson = useCallback((jsonInput: string) => {
        try {
            const parsed = JSON.parse(jsonInput);
            const topicObj = Array.isArray(parsed) ? parsed[0] : parsed;

            if (!topicObj || typeof topicObj !== 'object' || !topicObj.title) {
                showToast('JSON must include at least a "title" field.', 'error');
                return false;
            }

            const newTopic: AdminTopicData = {
                id: topicObj.id,
                title: String(topicObj.title || 'Imported Topic'),
                description: String(topicObj.description || ''),
                category: String(topicObj.category || 'Topic'),
                level: topicObj.level || 'Beginner',
                track: topicObj.track || 'conceptual',
                duration: String(topicObj.duration || '30 mins'),
                orderIndex: topics.length + 1,
                status: topicObj.status || 'DRAFT',
                subtopics: Array.isArray(topicObj.subtopics) ? topicObj.subtopics.map((s: any, idx: number) => ({
                    id: s.id,
                    title: String(s.title || `Section ${idx + 1}`),
                    content: String(s.content || ''),
                    orderIndex: s.orderIndex || idx + 1,
                    level: s.level || 'Beginner',
                    track: s.track || 'conceptual',
                    estimatedMinutes: s.estimatedMinutes || 5,
                    videoUrl: s.videoUrl || '',
                    status: s.status || 'DRAFT',
                    questions: Array.isArray(s.questions) ? s.questions : [],
                    codeSnippets: Array.isArray(s.codeSnippets) ? s.codeSnippets : []
                })) : [{
                    title: 'Introduction & Overview',
                    content: '### Section Overview\n\nAdd content details.',
                    orderIndex: 1,
                    status: 'DRAFT'
                }]
            };

            setTopics(prev => [...prev, newTopic]);
            setActiveTopicIndex(topics.length);
            setActiveSubtopicIndex(0);
            showToast(`Topic "${newTopic.title}" imported successfully!`, 'success');
            return true;
        } catch (err: any) {
            showToast(`Invalid Topic JSON: ${err.message || 'Syntax error'}`, 'error');
            return false;
        }
    }, [topics, showToast]);

    const handleMoveTopicUp = useCallback((index: number) => {
        if (index <= 0) return;
        setTopics(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            next.forEach((t, i) => { t.orderIndex = i + 1; });
            return next;
        });
        setActiveTopicIndex(prev => prev === index ? index - 1 : (prev === index - 1 ? index : prev));
    }, []);

    const handleMoveTopicDown = useCallback((index: number) => {
        setTopics(prev => {
            if (index >= prev.length - 1) return prev;
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            next.forEach((t, i) => { t.orderIndex = i + 1; });
            return next;
        });
        setActiveTopicIndex(prev => prev === index ? index + 1 : (prev === index + 1 ? index : prev));
    }, []);

    const handleAttachExistingTopic = useCallback((topic: AdminTopicData) => {
        setTopics(prev => [...prev, { ...topic, orderIndex: prev.length + 1 }]);
        setActiveTopicIndex(topics.length);
        setActiveSubtopicIndex(0);
    }, [topics]);

    const handleRemoveTopic = useCallback((index: number) => {
        setTopics(prev => prev.filter((_item: AdminTopicData, i: number) => i !== index));
        setActiveTopicIndex(ai => Math.min(ai, Math.max(0, topics.length - 2)));
    }, [topics]);

    const handleUpdateTopic = useCallback((index: number, field: keyof AdminTopicData, value: string) => {
        setTopics(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }, []);

    const handleAddSubtopic = useCallback((topicIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = topic.subtopics || [];
            const newSubtopic: AdminSubtopicData = {
                title: 'New Subtopic',
                content: '### Section Overview\n\nEnter subtopic body content here.',
                orderIndex: subtopics.length + 1,
                status: 'DRAFT',
            };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics: [...subtopics, newSubtopic] };
            setActiveSubtopicIndex(subtopics.length);
            return updated;
        });
    }, []);

    const handleRemoveSubtopic = useCallback((topicIndex: number, subtopicIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const updated = [...prev];
            updated[topicIndex] = {
                ...topic,
                subtopics: topic.subtopics.filter((_, i) => i !== subtopicIndex),
            };
            return updated;
        });
    }, []);

    const handleUpdateSubtopic = useCallback((
        topicIndex: number,
        subtopicIndex: number,
        field: keyof AdminSubtopicData,
        value: any,
    ) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const updatedSubtopics = [...topic.subtopics];
            updatedSubtopics[subtopicIndex] = { ...updatedSubtopics[subtopicIndex], [field]: value };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics: updatedSubtopics };
            return updated;
        });
    }, []);

    const handleAddQuestion = useCallback((topicIndex: number, subtopicIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = targetSub.questions || [];
            const newQ: import('../../api/admin.api').QuizQuestionDto = {
                kind: 'mcq',
                prompt: 'Enter question prompt here...',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: 'Explanation for why Option A is correct.',
                points: 5,
            };
            subtopics[subtopicIndex] = { ...targetSub, questions: [...questions, newQ] };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const handleRemoveQuestion = useCallback((topicIndex: number, subtopicIndex: number, questionIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = (targetSub.questions || []).filter((_, i) => i !== questionIndex);
            subtopics[subtopicIndex] = { ...targetSub, questions };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const handleUpdateQuestion = useCallback((
        topicIndex: number,
        subtopicIndex: number,
        questionIndex: number,
        field: keyof import('../../api/admin.api').QuizQuestionDto,
        value: any,
    ) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = [...(targetSub.questions || [])];
            questions[questionIndex] = { ...questions[questionIndex], [field]: value };
            subtopics[subtopicIndex] = { ...targetSub, questions };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const handleAddOption = useCallback((topicIndex: number, subtopicIndex: number, questionIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = [...(targetSub.questions || [])];
            const q = questions[questionIndex];
            const options = [...(q.options || []), `Option ${q.options ? q.options.length + 1 : 1}`];
            questions[questionIndex] = { ...q, options };
            subtopics[subtopicIndex] = { ...targetSub, questions };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const handleRemoveOption = useCallback((topicIndex: number, subtopicIndex: number, questionIndex: number, optionIndex: number) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = [...(targetSub.questions || [])];
            const q = questions[questionIndex];
            const options = (q.options || []).filter((_, i) => i !== optionIndex);
            const correctAnswer = q.correctAnswer === q.options[optionIndex] ? (options[0] || '') : q.correctAnswer;
            questions[questionIndex] = { ...q, options, correctAnswer };
            subtopics[subtopicIndex] = { ...targetSub, questions };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const handleUpdateOption = useCallback((
        topicIndex: number,
        subtopicIndex: number,
        questionIndex: number,
        optionIndex: number,
        value: string
    ) => {
        setTopics(prev => {
            const topic = prev[topicIndex];
            const subtopics = [...topic.subtopics];
            const targetSub = subtopics[subtopicIndex];
            const questions = [...(targetSub.questions || [])];
            const q = questions[questionIndex];
            const options = [...(q.options || [])];
            const oldVal = options[optionIndex];
            options[optionIndex] = value;
            const correctAnswer = q.correctAnswer === oldVal ? value : q.correctAnswer;
            questions[questionIndex] = { ...q, options, correctAnswer };
            subtopics[subtopicIndex] = { ...targetSub, questions };
            const updated = [...prev];
            updated[topicIndex] = { ...topic, subtopics };
            return updated;
        });
    }, []);

    const buildPayload = (overrideStatus: 'DRAFT' | 'PUBLISHED'): AdminPathData => ({
        id: pathId || undefined,
        title,
        description,
        category,
        managedBy,
        status: overrideStatus,
        topics: topics.map((t, idx) => ({
            ...t,
            orderIndex: t.orderIndex && t.orderIndex > 0 ? t.orderIndex : idx + 1,
            subtopics: (t.subtopics || []).map((st, stIdx) => ({
                ...st,
                orderIndex: st.orderIndex && st.orderIndex > 0 ? st.orderIndex : stIdx + 1,
            })),
        })),
    });

    const handleSaveDraft = useCallback(async () => {
        if (!title.trim()) { showToast('Please enter a course title', 'error'); return; }
        setIsSaving(true);
        try {
            const saved = await saveAdminPath(buildPayload('DRAFT'));
            if (saved && saved.topics) {
                setTopics(saved.topics);
            }
            showToast('Course saved as DRAFT successfully!', 'success');
            onSaveSuccess();
        } catch {
            showToast('Failed to save course draft', 'error');
        } finally {
            setIsSaving(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, category, managedBy, topics, pathId, onSaveSuccess, showToast]);

    const handlePublish = useCallback(async () => {
        if (!title.trim()) { showToast('Please enter a course title', 'error'); return; }
        setIsSaving(true);
        try {
            const saved = await saveAdminPath(buildPayload('PUBLISHED'));
            if (saved && saved.topics) {
                setTopics(saved.topics);
            }
            showToast('Course PUBLISHED successfully!', 'success');
            onSaveSuccess();
        } catch {
            showToast('Failed to publish course', 'error');
        } finally {
            setIsSaving(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, category, managedBy, topics, pathId, onSaveSuccess, showToast]);

    return {
        isLoading, isSaving,
        title, setTitle,
        description, setDescription,
        category, setCategory,
        managedBy, setManagedBy,
        status,
        topics,
        activeTopicIndex, setActiveTopicIndex,
        activeSubtopicIndex, setActiveSubtopicIndex,
        handleAddTopic, handleAddTopicFromJson, handleMoveTopicUp, handleMoveTopicDown, handleAttachExistingTopic, handleRemoveTopic, handleUpdateTopic,
        handleAddSubtopic, handleRemoveSubtopic, handleUpdateSubtopic,
        handleAddQuestion, handleRemoveQuestion, handleUpdateQuestion,
        handleAddOption, handleRemoveOption, handleUpdateOption,
        handleSaveDraft, handlePublish,
    };
};
