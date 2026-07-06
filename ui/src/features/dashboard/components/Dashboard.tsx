import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { Button } from '../../../shared/components/Button/Button';
import { Input } from '../../../shared/components/Input/Input';
import styles from './Dashboard.module.css';

interface DashboardProps {
    profile: UserProfile | null;
    onSaveProfile: (fullName: string, avatar: string, role: string, bio: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    profile,
    onSaveProfile
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

    const handleSave = () => {
        onSaveProfile(fullName, avatar, role, bio);
        setIsEditing(false);
    };

    return (
        <div className={styles.container}>
            <main className={styles.mainLayout}>
                {/* Profile collapsable settings block */}
                {isEditing ? (
                    <section className={styles.profileEditSection}>
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
                    </section>
                ) : (
                    <div className={styles.welcomeHeader}>
                        <div>
                            <h1 className={styles.welcomeTitle}>Welcome back, {fullName}!</h1>
                            <p className={styles.welcomeSubtitle}>{role} · {avatar}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Settings
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};
export default Dashboard;
