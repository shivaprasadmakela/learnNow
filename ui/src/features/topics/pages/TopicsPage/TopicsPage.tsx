import React, { useState } from 'react';
import { Plus, FileCode } from 'lucide-react';
import { useToast } from '../../../../shared/components/feedback/Toast';
import styles from './TopicsPage.module.css';
import type { TopicsPageProps } from './TopicsPage.types';
import { TopicHeroBanner } from '../../components/TopicHeroBanner';
import { ViewModeToggle } from '../../components/ViewModeToggle';
import { TopicCardList } from '../../components/TopicCardList';
import { CreateTopicModal } from '../../../iam-admin/components/ConfigurationEditor/components/CreateTopicModal';
import { CreateSubtopicModal } from '../../components/CreateSubtopicModal/CreateSubtopicModal';

export const TopicsPage: React.FC<TopicsPageProps> = ({
    pathTitle,
    description,
    managedBy = 'learnNow',
    activitiesCount,
    topics,
    progressPercent = 0,
    isAdmin = false,
    onSelectTopic,
    onAddTopicToPath,
    onAddSubtopicToTopic
}) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
    const [isCreateSubtopicOpen, setIsCreateSubtopicOpen] = useState(false);

    const dynamicCount = typeof activitiesCount === 'number' ? activitiesCount : (topics ? topics.length : 0);

    const handleTopicClick = (id: number | string, title: string, subtopicId?: number | string, subtopicTitle?: string) => {
        if (onSelectTopic) {
            onSelectTopic(id, subtopicId, subtopicTitle);
        } else {
            showToast(`"${title}" workspace lessons are launching soon!`, 'info');
        }
    };

    const handleContinueClick = () => {
        if (!topics || topics.length === 0) {
            showToast("Path launch is in progress!", "info");
            return;
        }

        // 1. Search for the first uncompleted subtopic across all topics
        for (const topic of topics) {
            if (topic.subtopics && topic.subtopics.length > 0) {
                const firstUncompletedSub = topic.subtopics.find(st => !st.isCompleted);
                if (firstUncompletedSub) {
                    handleTopicClick(topic.id, topic.title, firstUncompletedSub.id, firstUncompletedSub.title);
                    return;
                }
            }
        }

        // 2. If subtopics are not embedded directly in the topic objects, find the first uncompleted topic
        const firstUncompletedTopic = topics.find(t => !t.isCompleted);
        if (firstUncompletedTopic) {
            const firstSub = firstUncompletedTopic.subtopics?.[0];
            handleTopicClick(firstUncompletedTopic.id, firstUncompletedTopic.title, firstSub?.id, firstSub?.title);
            return;
        }

        // 3. If 100% completed, default to the first topic
        const defaultTopic = topics[0];
        const defaultSub = defaultTopic.subtopics?.[0];
        handleTopicClick(defaultTopic.id, defaultTopic.title, defaultSub?.id, defaultSub?.title);
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
                <TopicHeroBanner
                    pathTitle={pathTitle}
                    description={description}
                    managedBy={managedBy}
                    activitiesCount={dynamicCount}
                    progressPercent={progressPercent}
                    onContinueClick={handleContinueClick}
                />

                {/* Admin Management Toolbar on Main Path View */}
                {isAdmin && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '1rem',
                        padding: '12px 16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--tech-blue)' }}>
                            <FileCode size={16} />
                            <span>Admin Content Management</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsCreateTopicOpen(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--tech-blue)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={14} /> Add Topic (Form / JSON)
                            </button>

                            {topics.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreateSubtopicOpen(true)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--tech-blue)',
                                        background: 'transparent',
                                        color: 'var(--tech-blue)',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={14} /> Add Subtopic (Form / JSON)
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            </div>

            <div className={styles.listScrollArea}>
                <TopicCardList
                    topics={topics}
                    viewMode={viewMode}
                    onTopicClick={handleTopicClick}
                />
            </div>

            {/* Admin Topic Creation Modal (Form vs Raw JSON) */}
            <CreateTopicModal
                isOpen={isCreateTopicOpen}
                onClose={() => setIsCreateTopicOpen(false)}
                onCreateTopic={async (newTopic: any) => {
                    if (onAddTopicToPath) {
                        await onAddTopicToPath(newTopic);
                    }
                }}
                onImportTopicJson={(jsonInput: string) => {
                    try {
                        const parsed = JSON.parse(jsonInput);
                        if (onAddTopicToPath) {
                            onAddTopicToPath(parsed);
                        }
                        return true;
                    } catch (err: any) {
                        showToast(`Invalid Topic JSON: ${err.message}`, 'error');
                        return false;
                    }
                }}
            />

            {/* Admin Subtopic Creation Modal (Form vs Raw JSON) */}
            {topics.length > 0 && (
                <CreateSubtopicModal
                    isOpen={isCreateSubtopicOpen}
                    onClose={() => setIsCreateSubtopicOpen(false)}
                    topics={topics.map(t => ({ id: t.id, title: t.title }))}
                    onAddSubtopic={async (targetTopicId, subtopicData) => {
                        if (onAddSubtopicToTopic) {
                            return await onAddSubtopicToTopic(targetTopicId, subtopicData);
                        }
                        return false;
                    }}
                />
            )}
        </div>
    );
};

// Aliased export for backwards compatibility
export const PathRoadmapPage = TopicsPage;
export type PathRoadmapPageProps = TopicsPageProps;

export default TopicsPage;
