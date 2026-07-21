import React, { useState } from 'react';
import { LayoutGrid, List, ArrowRight } from 'lucide-react';
import { useToast } from '../../../shared/components/feedback/Toast';
import styles from '../styles/PathRoadmap.module.css';
import bunnyBrain from '../../../assets/bunny-brain.png';
import { LearningCard } from '../../../shared/components/cards';

export interface Topic {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    isCompleted?: boolean;
    progressPercentage?: number;
}

export interface PathRoadmapPageProps {
    pathTitle: string;
    managedBy?: string;
    activitiesCount?: number;
    lastUpdated?: string;
    topics: Topic[];
    progressPercent?: number;
    onSelectTopic?: (id: number) => void;
}

export const PathRoadmapPage: React.FC<PathRoadmapPageProps> = ({
    pathTitle,
    managedBy = 'learnNow',
    activitiesCount = 8,
    lastUpdated = 'Recently',
    topics,
    progressPercent = 0,
    onSelectTopic
}) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleTopicClick = (id: number, title: string) => {
        if (onSelectTopic) {
            onSelectTopic(id);
        } else {
            showToast(`"${title}" workspace lessons are launching soon!`, 'info');
        }
    };

    const handleContinueClick = () => {
        if (topics && topics.length > 0) {
            handleTopicClick(topics[0].id, topics[0].title);
        } else {
            showToast("Path launch is in progress!", "info");
        }
    };

    return (
        <div className={styles.container}>
            {/* Hero Banner — dark navy card with bottom-right notch */}
            <div className={styles.heroBannerWrapper}>
                <div className={styles.heroBanner}>
                    {/* Top content: left info + right illustration */}
                    <div className={styles.heroTopContent}>
                        {/* Left: Badge, Title, Details */}
                        <div className={styles.heroLeft}>
                            <div className={styles.heroBadge}>
                                <span className={styles.heroBadgeIcon}>❋</span>
                                Path
                            </div>
                            <h1 className={styles.heroTitle}>{pathTitle}</h1>
                            <div className={styles.metaRow}>
                                <span className={styles.metaDetail}>Managed by {managedBy}</span>
                                <span className={styles.metaDetail}>{activitiesCount} topics</span>
                                <span className={styles.metaDetail}>Last updated {lastUpdated}</span>
                            </div>
                        </div>

                        {/* Right: Bunny brain learning illustration */}
                        <div className={styles.heroRight}>
                            <img src={bunnyBrain} className={styles.bunnyBrainImg} alt="Learning Path Illustration" />
                        </div>
                    </div>

                    {/* Bottom CTA + Progress */}
                    <div className={styles.progressRow}>
                        <button className={styles.continueButton} onClick={handleContinueClick}>
                            <ArrowRight size={16} />
                            {progressPercent > 0 ? 'Continue' : 'Start'}
                        </button>
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressTrack} title={`Your path progress: ${progressPercent}%`}>
                                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                            {progressPercent}% Complete
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions & view mode toggles */}
            <div className={styles.actionRow} style={{ justifyContent: 'flex-end' }}>
                <div className={styles.toggleGroup}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid size={14} /> Grid
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <List size={14} /> List
                    </button>
                </div>
            </div>

            {/* Course Topics grid / list */}
            <div className={viewMode === 'grid' ? styles.courseGrid : styles.subtopicListContainer}>
                {topics.map((topic) => {
                    const topicPct = topic.isCompleted ? 100 : (topic.progressPercentage || 0);

                    return (
                        <LearningCard
                            key={topic.id}
                            layout={viewMode}
                            badgeLabel={topic.category || 'Course'}
                            title={topic.title}
                            description={viewMode === 'grid' ? topic.description : undefined}
                            duration={topic.duration || '2 hours'}
                            progressPercentage={topicPct}
                            showProgress={topicPct > 0}
                            isCompleted={topic.isCompleted}
                            onClick={() => handleTopicClick(topic.id, topic.title)}
                            buttonTooltip={`Explore ${topic.title}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};
