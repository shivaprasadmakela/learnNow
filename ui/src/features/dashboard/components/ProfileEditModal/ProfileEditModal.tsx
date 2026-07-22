import React, { useState } from 'react';
import type { UserProfile } from '../../../../types';
import { Button, Input } from '../../../../shared/components';
import styles from './ProfileEditModal.module.css';

interface ProfileEditModalProps {
    profile: UserProfile | null;
    onSaveProfile: (fullName: string, avatar: string, role: string, bio: string) => void;
    onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    profile,
    onSaveProfile,
    onClose
}) => {
    const [fullName, setFullName] = useState<string>(profile?.fullName || 'Alex Learner');
    const [avatar, setAvatar] = useState<string>(profile?.avatar || '👨‍💻');
    const [role, setRole] = useState<string>(profile?.role || 'Junior Fullstack Engineer');
    const [bio, setBio] = useState<string>(profile?.bio || 'Learning React & Spring Boot.');

    const handleSave = () => {
        onSaveProfile(fullName, avatar, role, bio);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.formTitle}>Edit Profile Settings</h3>
                <div className={styles.formRow}>
                    <Input
                        label="Avatar (Emoji)"
                        value={avatar}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatar(e.target.value)}
                    />
                    <Input
                        label="Full Name (Printed on Certificate)"
                        value={fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    />
                </div>
                <Input
                    label="Current Role"
                    value={role}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
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
                <div className={styles.actionsRow}>
                    <Button variant="primary" onClick={handleSave}>
                        Save Changes
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;
