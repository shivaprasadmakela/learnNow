import React from 'react';
import styles from './BrandFooter.module.css';

export const BrandFooter: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.hashtag}>#BecomeCareerReady</h1>
            <p className={styles.subtitle}>Your go to place for upskilling and becoming job ready!</p>
            <p className={styles.author}>
                Made with <span className={styles.heart}>❤️</span> by learnNow Team
            </p>
        </div>
    );
};

export default BrandFooter;
