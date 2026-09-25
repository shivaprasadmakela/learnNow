import React, { useEffect, useState } from 'react';
import { Users, Code, Award, CheckCircle, Database } from 'lucide-react';
import { useInView, usePrefersReducedMotion } from '../../../shared/hooks';
import styles from '../styles/Home.module.css';

interface CommunityProps {
    onSelectCourse: (courseId: number) => void;
}

const STATS = [
    { value: 5000, suffix: '+', label: 'Active Engineers' },
    { value: 120, suffix: '+', label: 'Micro-Lessons' },
    { value: 98, suffix: '%', label: 'Completion Rate' }
];

const COUNT_MS = 1400;

/**
 * Counts a number up once, when it is first looked at.
 *
 * Tied to visibility rather than to mount: these sit most of a page below the fold, and a counter
 * that finishes while it is still off screen has animated for nobody. Reduced motion skips
 * straight to the final value — the number is the content, the counting is decoration.
 */
const useCountUp = (target: number, active: boolean): number => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [value, setValue] = useState(0);

    useEffect(() => {
        // Reduced motion is handled in the return below rather than by setting state here: the
        // final value is derived, so there is no animation to start and nothing to keep in sync.
        if (!active || prefersReducedMotion) return;

        let frame = 0;
        const start = performance.now();

        const step = (now: number) => {
            const progress = Math.min(1, (now - start) / COUNT_MS);
            // Ease out: fast at first, then settling, so the last digits are readable.
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target, active, prefersReducedMotion]);

    return prefersReducedMotion ? target : value;
};

const Stat: React.FC<{ value: number; suffix: string; label: string; active: boolean }> = ({
    value,
    suffix,
    label,
    active
}) => {
    const shown = useCountUp(value, active);
    return (
        <div className={styles.statBox}>
            <div className={styles.statNum}>
                {shown.toLocaleString('en-IN')}
                {suffix}
            </div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
};

const PIPELINE = [
    {
        id: 'view',
        icon: <Code size={14} />,
        label: 'React 19 + TypeScript View',
        detail: 'Feature-first modules, CSS Module theming and lazy routes — the same code this page is built from.'
    },
    {
        id: 'api',
        icon: <Award size={14} />,
        label: 'Fetch REST API / JWT Security',
        detail: 'A typed client over stateless JWT auth, with refresh handled once instead of in every screen.'
    },
    {
        id: 'service',
        icon: <Users size={14} />,
        label: 'Spring Boot 3 Modular Service',
        detail: 'One deployable, many modules. Clear seams between features without the cost of running twelve services.'
    },
    {
        id: 'data',
        icon: <Database size={14} />,
        label: 'PostgreSQL + Flyway Schema',
        detail: 'Every schema change is a versioned migration, so the database is as reviewable as the code.'
    }
];

export const Community: React.FC<CommunityProps> = ({ onSelectCourse }) => {
    const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.4 });
    const [activeNode, setActiveNode] = useState(PIPELINE[0].id);

    const active = PIPELINE.find(node => node.id === activeNode) ?? PIPELINE[0];

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
                <div className={styles.statsGrid} ref={statsRef}>
                    {STATS.map(stat => (
                        <Stat key={stat.label} {...stat} active={statsInView} />
                    ))}
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
                    {/*
                      * The stack used to light two of the four nodes for decoration. They are
                      * controls now: one layer is selected at a time and explains itself below,
                      * which turns a static diagram into something worth clicking through.
                      */}
                    <div className={styles.gearPipeline}>
                        {PIPELINE.map((node, index) => (
                            <React.Fragment key={node.id}>
                                {index > 0 && <div className={styles.pipelineLine} />}
                                <button
                                    type="button"
                                    className={`${styles.pipelineNode} ${
                                        node.id === activeNode ? styles.pipelineNodeActive : ''
                                    }`}
                                    aria-pressed={node.id === activeNode}
                                    onClick={() => setActiveNode(node.id)}
                                    onMouseEnter={() => setActiveNode(node.id)}
                                >
                                    {node.icon} {node.label}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                    <p key={active.id} className={styles.pipelineDetail}>
                        <CheckCircle size={13} /> {active.detail}
                    </p>
                    <div className={styles.gearSubtitle}>Growth · Engineer · Academy · Ready</div>
                </div>
            </div>
        </section>
    );
};

export default Community;
