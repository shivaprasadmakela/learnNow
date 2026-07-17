import React, { useState } from 'react';
import { LayoutGrid, List, ArrowRight, Clock, Award } from 'lucide-react';
import { useToast } from '../../../shared/components/feedback/Toast';
import styles from '../styles/Roadmap.module.css';
import bunnyBrain from '../../../assets/bunny-brain.png';

export interface Subtopic {
    id: number;
    title: string;
    description: string;
    category: 'course' | 'lab' | 'skill badge';
    duration: string;
    isCompleted?: boolean;
}

export interface RoadmapPageProps {
    pathTitle: string;
    managedBy?: string;
    activitiesCount?: number;
    lastUpdated?: string;
    subtopics: Subtopic[];
    progressPercent?: number;
    onSelectSubtopic?: (id: number) => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({
    pathTitle,
    managedBy = 'learnNow',
    activitiesCount = 8,
    lastUpdated = 'Recently',
    subtopics,
    progressPercent = 0,
    onSelectSubtopic
}) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleSubtopicClick = (id: number, title: string) => {
        if (onSelectSubtopic) {
            onSelectSubtopic(id);
        } else {
            showToast(`"${title}" workspace lessons are launching soon!`, 'info');
        }
    };

    const handleContinueClick = () => {
        if (subtopics && subtopics.length > 0) {
            handleSubtopicClick(subtopics[0].id, subtopics[0].title);
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
                                <span className={styles.metaDetail}>{activitiesCount} activities</span>
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
                            <div className={styles.progressTrack} title={`Your progress: ${progressPercent}%`}>
                                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
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

            {/* Course Subtopics grid / list */}
            <div className={viewMode === 'grid' ? styles.courseGrid : styles.subtopicListContainer}>
                {subtopics.map((topic) => (
                    <div
                        key={topic.id}
                        className={`${styles.subtopicCard} ${viewMode === 'list' ? styles.subtopicCardList : ''}`}
                        onClick={() => handleSubtopicClick(topic.id, topic.title)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Left: badge + title (+ description in grid only) */}
                        <div className={styles.subtopicCardMain}>
                            <div className={styles.subtopicCardHeader}>
                                <span className={styles.subtopicBadge}>
                                    <Award size={10} style={{ marginRight: '3px' }} />
                                    {topic.category}
                                </span>
                                {topic.isCompleted && (
                                    <span className={styles.subtopicBadge} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--tech-green)' }}>
                                        Completed
                                    </span>
                                )}
                            </div>
                            <h3 className={styles.subtopicTitle}>{topic.title}</h3>
                            {viewMode === 'grid' && <p className={styles.subtopicDesc}>{topic.description}</p>}
                        </div>

                        {/* Right: duration + arrow */}
                        <div className={styles.subtopicFooter}>
                            <div className={styles.durationWrapper}>
                                <Clock size={12} />
                                <span>{topic.duration}</span>
                            </div>
                            <button
                                className={styles.exploreArrow}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubtopicClick(topic.id, topic.title);
                                }}
                                title="Explore Topic"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
