import React from 'react';
import { Users, Code, Award, CheckCircle } from 'lucide-react';
import styles from '../styles/Home.module.css';

interface CommunityProps {
    onSelectCourse: (courseId: number) => void;
}

export const Community: React.FC<CommunityProps> = ({ onSelectCourse }) => {
    return (
        <section className={styles.communitySection}>
            <div className={styles.communityLeft}>
                <div className={styles.sectionBadge}>
                    <Users size={14} /> Developer Ecosystem
                </div>
                <h2 className={styles.communityTitle}>Learn and Build With Other Engineers</h2>
                <p className={styles.communityDesc}>
                    Continuous learning starts with structured practice. Join the Learn with Shiva platform and
                    accelerate your journey with guided learning paths, real-time feedback, and fullstack architectural patterns.
                </p>
                <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                        <div className={styles.statNum}>5,000+</div>
                        <div className={styles.statLabel}>Active Engineers</div>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statNum}>120+</div>
                        <div className={styles.statLabel}>Micro-Lessons</div>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statNum}>98%</div>
                        <div className={styles.statLabel}>Completion Rate</div>
                    </div>
                </div>
                <button className={styles.communityJoinBtn} onClick={() => onSelectCourse(1)}>
                    Join Platform Free
                </button>
            </div>
            <div className={styles.communityRight}>
                <div className={styles.gearCard}>
                    <div className={styles.gearHeader}>
                        <div className={styles.gearTitle}>GEAR PIPELINE</div>
                        <div className={styles.gearBadge}>Architecture</div>
                    </div>
                    <div className={styles.gearPipeline}>
                        <div className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                            <Code size={14} /> React 19 + TypeScript View
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={styles.pipelineNode}>
                            <Award size={14} /> Fetch REST API / JWT Security
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={styles.pipelineNode}>
                            <Users size={14} /> Spring Boot 3 Modular Service
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                            <CheckCircle size={14} /> PostgreSQL + Flyway Schema
                        </div>
                    </div>
                    <div className={styles.gearSubtitle}>Growth · Engineer · Academy · Ready</div>
                </div>
            </div>
        </section>
    );
};

export default Community;
