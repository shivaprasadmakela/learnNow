import React from 'react';
import styles from './Home.module.css';

interface CommunityProps {
    onSelectCourse: (courseId: number) => void;
}

export const Community: React.FC<CommunityProps> = ({ onSelectCourse }) => {
    return (
        <section className={styles.communitySection}>
            <div className={styles.communityLeft}>
                <h2 className={styles.communityTitle}>Learn and build with other developers</h2>
                <p className={styles.communityDesc}>
                    Continuous learning starts with community. Join the Learn with Shiva program and
                    accelerate your journey with structured learning paths, collaborative projects,
                    and hands-on exercises — at no cost to you.
                </p>
                <button className={styles.communityJoinBtn} onClick={() => onSelectCourse(1)}>
                    Join Now
                </button>
            </div>
            <div className={styles.communityRight}>
                <div className={styles.gearCard}>
                    <div className={styles.gearTitle}>GEAR</div>
                    <div className={styles.gearPipeline}>
                        <div className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                            React TypeScript View
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={styles.pipelineNode}>
                            Fetch REST API / CORS
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={styles.pipelineNode}>
                            Spring Boot Controller
                        </div>
                        <div className={styles.pipelineLine} />
                        <div className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                            JPA Persistent H2 DB
                        </div>
                    </div>
                    <div className={styles.gearSubtitle}>Growth · Engineer · Academy · Ready</div>
                </div>
            </div>
        </section>
    );
};
export default Community;
