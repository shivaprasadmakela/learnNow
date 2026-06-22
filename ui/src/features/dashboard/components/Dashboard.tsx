import React, { useState, useEffect } from 'react';
import type { Course, UserProgress, UserProfile } from '../../../features/learning/types';
import { Button } from '../../../shared/components/Button/Button';
import { Input } from '../../../shared/components/Input/Input';
import { AwardIcon, BookOpenIcon } from '../../../shared/components/Icons';
import styles from './Dashboard.module.css';

interface DashboardProps {
    courses: Course[];
    progress: UserProgress[];
    profile: UserProfile | null;
    onBack: () => void;
    onResetProgress: () => void;
    onSelectCourse: (id: number) => void;
    onSaveProfile: (fullName: string, avatar: string, role: string, bio: string) => void;
    onChangeView: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    courses: _courses,
    progress,
    profile,
    onBack,
    onResetProgress,
    onSelectCourse,
    onSaveProfile,
    onChangeView
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string>(profile?.fullName || 'Alex Learner');
    const [avatar, setAvatar] = useState<string>(profile?.avatar || '👨‍💻');
    const [role, setRole] = useState<string>(profile?.role || 'Junior Fullstack Engineer');
    const [bio, setBio] = useState<string>(profile?.bio || 'Learning React & Spring Boot.');

    // Sync state with profile loaded from API
    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName);
            setAvatar(profile.avatar);
            setRole(profile.role);
            setBio(profile.bio);
        }
    }, [profile]);

    const completedCount = progress.filter(p => p.completed).length;
    const progressVal = Math.min(Math.round((completedCount / 8) * 100), 100); // course 1 has 8 lessons
    const hasCertificate = progressVal === 100;

    const handleSave = () => {
        onSaveProfile(fullName, avatar, role, bio);
        setIsEditing(false);
    };

    return (
        <div className={styles.container}>
            {/* Header bar */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>
                    ← Back to catalog
                </button>
                <h2 className={styles.headerTitle}>My Learning Portal</h2>
            </header>

            <main className={styles.mainLayout}>
                {/* Profile Editor Card */}
                <section className={styles.profileSection}>
                    <div className={styles.profileCard}>
                        {!isEditing ? (
                            <div className={styles.profileView}>
                                <div className={styles.avatarCircle}>{profile?.avatar || avatar}</div>
                                <div className={styles.profileDetails}>
                                    <h3 className={styles.profileName}>{profile?.fullName || fullName}</h3>
                                    <span className={styles.profileRole}>{profile?.role || role}</span>
                                    <p className={styles.profileBio}>{profile?.bio || bio}</p>
                                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                        Edit Profile name
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.profileForm}>
                                <h3 className={styles.formTitle}>Edit Profile Settings</h3>
                                <div className={styles.formRow}>
                                    <Input 
                                        label="Avatar (Emoji)" 
                                        value={avatar} 
                                        onChange={(e) => setAvatar(e.target.value)} 
                                    />
                                    <Input 
                                        label="Full Name (Printed on Certificate)" 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)} 
                                    />
                                </div>
                                <Input 
                                    label="Current Role" 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)} 
                                />
                                <div className={styles.textareaContainer}>
                                    <label className={styles.textareaLabel}>Bio</label>
                                    <textarea 
                                        className={styles.textarea}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <Button variant="primary" onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Metrics Dashboard Grid */}
                    <div className={styles.statsCardGrid}>
                        <div className={styles.statMetricCard}>
                            <span className={styles.metricLabel}>Courses Enrolled</span>
                            <span className={styles.metricNumber}>1</span>
                        </div>
                        <div className={styles.statMetricCard}>
                            <span className={styles.metricLabel}>Completed Lessons</span>
                            <span className={styles.metricNumber}>{completedCount} / 8</span>
                        </div>
                        <div className={styles.statMetricCard}>
                            <span className={styles.metricLabel}>Certificates Earned</span>
                            <span className={styles.metricNumber}>{hasCertificate ? "1" : "0"}</span>
                        </div>
                    </div>
                </section>

                {/* Enrolled Courses list */}
                <section className={styles.coursesSection}>
                    <h3 className={styles.sectionHeading}>My active pathways</h3>
                    <div className={styles.pathwayCard}>
                        <div className={styles.pathwayLeft}>
                            <BookOpenIcon size={24} style={{ color: 'var(--tech-blue)' }} />
                            <div>
                                <h4 className={styles.pathwayTitle}>React & Spring Boot Fullstack Development</h4>
                                <span className={styles.pathwayMeta}>Syllabus Chapters: 4 Modules, 8 Lessons</span>
                            </div>
                        </div>

                        <div className={styles.pathwayRight}>
                            <div className={styles.progressBlock}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                                    <span>Path completion</span>
                                    <span>{progressVal}%</span>
                                </div>
                                <div className={styles.progressLineOuter}>
                                    <div className={styles.progressLineInner} style={{ width: `${progressVal}%` }}></div>
                                </div>
                            </div>

                            <Button variant="primary" size="sm" onClick={() => onSelectCourse(1)}>
                                {progressVal === 0 ? "Start Path" : progressVal === 100 ? "Review Path" : "Resume Path"}
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Earned Credentials list */}
                <section className={styles.credentialsSection}>
                    <h3 className={styles.sectionHeading}>My earned certifications</h3>
                    {hasCertificate ? (
                        <div className={styles.certificateShowcaseCard}>
                            <div className={styles.certShowcaseLeft}>
                                <AwardIcon size={36} style={{ color: 'var(--tech-yellow)' }} />
                                <div>
                                    <h4 className={styles.certShowcaseTitle}>Certified Fullstack Integration Developer</h4>
                                    <p className={styles.certShowcaseMeta}>Issued to <strong>{profile?.fullName || fullName}</strong> upon course evaluation.</p>
                                </div>
                            </div>
                            <Button variant="primary" size="sm" onClick={() => onChangeView('CERTIFICATE')}>
                                View Certificate
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.emptyCertificatesCard}>
                            <AwardIcon size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                            <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>No certificates earned yet</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '360px', marginTop: '4px' }}>
                                Complete all 8 lessons and score 100% on their respective checks in the Fullstack Development path to claim your certificate!
                            </p>
                            <Button variant="secondary" size="sm" style={{ marginTop: '16px' }} onClick={() => onSelectCourse(1)}>
                                Continue Course ({progressVal}% Done)
                            </Button>
                        </div>
                    )}
                </section>

                {/* Reset Progress Section (for testing ease!) */}
                <section className={styles.dangerZone}>
                    <h3 className={styles.dangerZoneTitle}>Testing utility</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        If you want to clear your current completions to test the sandbox play or retake quizzes from the beginning, use the reset button below:
                    </p>
                    <Button variant="danger" size="sm" onClick={() => {
                        if (window.confirm("Are you sure you want to reset all your progress data? This cannot be undone.")) {
                            onResetProgress();
                        }
                    }}>
                        Reset All completions
                    </Button>
                </section>
            </main>
        </div>
    );
};
export default Dashboard;
