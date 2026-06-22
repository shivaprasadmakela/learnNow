import React, { useState } from 'react';
import type { Course, UserProgress } from '../../../features/learning/types';
import Hero from './Hero';
import CatalogBlock from './CatalogBlock';
import Community from './Community';
import FinalCTA from './FinalCTA';
import styles from './Home.module.css';

interface HomeProps {
    courses: Course[];
    progress: UserProgress[];
    onSelectCourse: (id: number) => void;
    onResetProgress: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isLoggedIn: boolean;
    setAuthModalOpen: (val: boolean) => void;
}

export const Home: React.FC<HomeProps> = ({
    courses,
    progress,
    onSelectCourse,
    onResetProgress: _onResetProgress,
    searchQuery,
    setSearchQuery,
    isLoggedIn,
    setAuthModalOpen
}) => {
    const [activeTab, setActiveTab] = useState<string>('Featured');

    const getCourseProgress = (courseId: number): number => {
        const course = courses.find(c => c.id === courseId);
        if (!course || course.id !== 1) return 0;
        const completedCount = progress.filter(p => p.completed).length;
        return Math.min(Math.round((completedCount / 8) * 100), 100);
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'Featured') return matchesSearch;
        if (activeTab === 'Fullstack') return matchesSearch && course.category === 'Fullstack';
        if (activeTab === 'Cloud') return matchesSearch && course.category === 'Cloud';
        if (activeTab === 'Backend') return matchesSearch && course.category === 'Backend';
        if (activeTab === 'Design') return matchesSearch && course.category === 'Design';
        return matchesSearch;
    });

    return (
        <div className={styles.homeWrapper}>
            {/* Notice Banner */}
            <div className={styles.noticeBanner}>
                <span className={styles.noticeText}>Practice code integrations directly in terminal console</span>
                <a className={styles.noticeLink} onClick={() => onSelectCourse(1)}>Get started</a>
            </div>

            <div className={styles.scrollContainer}>
                <Hero isLoggedIn={isLoggedIn} setAuthModalOpen={setAuthModalOpen} />
                <CatalogBlock
                    filteredCourses={filteredCourses}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    getCourseProgress={getCourseProgress}
                    onSelectCourse={onSelectCourse}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                <Community onSelectCourse={onSelectCourse} />
                <FinalCTA onSelectCourse={onSelectCourse} isLoggedIn={isLoggedIn} setAuthModalOpen={setAuthModalOpen} />
            </div>
        </div>
    );
};

export default Home;
