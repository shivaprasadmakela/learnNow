import React, { useState } from 'react';
import type { Course } from '../../../types';
import Hero from '../components/Hero';
import CatalogBlock from '../components/CatalogBlock';
import Community from '../components/Community';
import FinalCTA from '../components/FinalCTA';
import { SiteFooter } from '../../../shared/components/navigation/SiteFooter';
import styles from '../styles/Home.module.css';

interface HomeProps {
    courses: Course[];
    onSelectCourse: (id: number) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isLoggedIn: boolean;
    changeView: (
        view:
            | 'HOME'
            | 'DASHBOARD'
            | 'LOGIN'
            | 'PATHS'
            | 'TOPICS'
            | 'DSA'
            | 'COMPILER'
            | 'PROFILE'
            | 'PRIVACY'
    ) => void;
}

export const Home: React.FC<HomeProps> = ({
    onSelectCourse,
    isLoggedIn,
    changeView
}) => {
    const [activeTab, setActiveTab] = useState<string>('Featured');

    return (
        <div className={styles.homeWrapper}>
            <div className={styles.scrollContainer}>
                <Hero isLoggedIn={isLoggedIn} changeView={changeView} />
                <CatalogBlock
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onSelectCourse={onSelectCourse}
                />
                <Community onSelectCourse={onSelectCourse} />
                <FinalCTA onSelectCourse={onSelectCourse} isLoggedIn={isLoggedIn} changeView={changeView} />
            </div>

            {/*
              * Outside scrollContainer on purpose: that element is a 1400px column with a 140px
              * gap between sections, and a footer inside it would float as one more panel rather
              * than closing the page off edge to edge.
              */}
            <SiteFooter changeView={changeView} isLoggedIn={isLoggedIn} />
        </div>
    );
};

export default Home;
