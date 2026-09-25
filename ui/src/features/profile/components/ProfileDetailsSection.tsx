import React, { useState } from 'react';
import type { UserProfile } from '../../../types';
import { Button, Input } from '../../../shared/components';
import { AvatarPicker } from './AvatarPicker';
import styles from '../pages/ProfilePage/ProfilePage.module.css';

interface ProfileDetailsSectionProps {
    profile: UserProfile | null;
    onSaveProfile: (fullName: string, avatar: string, bio: string) => void;
}

/**
 * The right to correction, s.12(1).
 *
 * This is the old ProfileEditModal's contents, unchanged in substance and moved out of a dialog.
 * Correction is a right rather than a setting, and a right that lives behind a popup you have to
 * know to open is one most people never find.
 *
 * The email address is shown but not editable. It is the account identifier and the thing password
 * resets are sent to, so changing it needs a verification round-trip that does not exist yet —
 * saying so beside the field is more honest than an input that silently refuses.
 */
export const ProfileDetailsSection: React.FC<ProfileDetailsSectionProps> = ({
    profile,
    onSaveProfile
}) => {
    const [fullName, setFullName] = useState(profile?.fullName ?? '');
    const [avatar, setAvatar] = useState(profile?.avatar ?? profile?.id ?? 'learnnow');
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onSaveProfile(fullName, avatar, bio);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
    };

    return (
        <section className={styles.section}>
            <span className={styles.lawRef}>DPDP s.12 · Correction</span>
            <h2 className={styles.sectionTitle}>Your details</h2>
            <p className={styles.sectionIntro}>
                Everything here is yours to change at any time. Your name is what appears on
                anything you complete.
            </p>

            <AvatarPicker avatar={avatar} onChangeAvatar={setAvatar} />

            <div className={styles.fieldGrid} style={{ marginTop: 'var(--space-5)' }}>
                <Input
                    label="Full name"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFullName(e.target.value)
                    }
                />

                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="profile-email">
                        Email address
                    </label>
                    <div className={styles.readOnlyValue} id="profile-email">
                        {profile?.email ?? '—'}
                    </div>
                    <span className={styles.fieldHint}>
                        This identifies your account and receives password resets, so it cannot be
                        changed here yet. Raise a grievance below and we will change it for you.
                    </span>
                </div>

                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="profile-bio">
                        Bio
                    </label>
                    <textarea
                        id="profile-bio"
                        className={styles.textarea}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        rows={3}
                        placeholder="A sentence about what you are learning."
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="primary" onClick={handleSave}>
                    Save changes
                </Button>
                {saved && (
                    <span
                        role="status"
                        style={{
                            alignSelf: 'center',
                            fontSize: '0.85rem',
                            color: 'var(--tech-green)'
                        }}
                    >
                        Saved
                    </span>
                )}
            </div>
        </section>
    );
};
