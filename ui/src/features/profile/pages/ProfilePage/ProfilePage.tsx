import React, { useState } from 'react';
import type { UserProfile } from '../../../../types';
import { Avatar } from '../../../../shared/components/ui/Avatar';
import { ConsentCentreSection } from '../../components/ConsentCentreSection';
import { GrievanceSection } from '../../components/GrievanceSection';
import { NomineeSection } from '../../components/NomineeSection';
import { ProfileDetailsSection } from '../../components/ProfileDetailsSection';
import { YourDataSection } from '../../components/YourDataSection';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
    profile: UserProfile | null;
    onSaveProfile: (fullName: string, avatar: string, bio: string) => void;
    /** Called after the account has been erased, so the app can end the session. */
    onAccountErased: () => void;
}

type SectionKey = 'details' | 'consent' | 'data' | 'nominee' | 'grievances';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string }> = [
    { key: 'details', label: 'Your details', icon: 'fa-solid fa-user' },
    { key: 'consent', label: 'Consent', icon: 'fa-solid fa-circle-check' },
    { key: 'data', label: 'Your data', icon: 'fa-solid fa-download' },
    { key: 'nominee', label: 'Nominee', icon: 'fa-solid fa-user-shield' },
    { key: 'grievances', label: 'Grievances', icon: 'fa-solid fa-comment-dots' }
];

/**
 * The account page, replacing the profile dialog.
 *
 * A popup was the wrong container once this stopped being three fields. Everything the DPDP Act
 * gives a learner lives here — consent, a copy of their data, deletion, a nominee, a grievance
 * route — and rights need somewhere with an address you can link to and return to, not a modal
 * that exists only while it is open.
 *
 * Sections are mounted one at a time rather than rendered together and hidden. Four of the five
 * fetch on mount, so rendering all of them would fire five requests to show one panel.
 */
export const ProfilePage: React.FC<ProfilePageProps> = ({
    profile,
    onSaveProfile,
    onAccountErased
}) => {
    const [active, setActive] = useState<SectionKey>('details');

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerAvatar}>
                    <Avatar avatar={profile?.avatar} size={72} />
                </div>
                <div className={styles.headerText}>
                    <h1 className={styles.headerName}>{profile?.fullName || 'Your account'}</h1>
                    <p className={styles.headerEmail}>{profile?.email}</p>
                </div>
            </header>

            <div className={styles.layout}>
                <nav className={styles.nav} aria-label="Account sections">
                    {SECTIONS.map(section => (
                        <button
                            key={section.key}
                            className={`${styles.navItem} ${
                                active === section.key ? styles.navItemActive : ''
                            }`}
                            onClick={() => setActive(section.key)}
                            aria-current={active === section.key ? 'page' : undefined}
                        >
                            <i className={`${section.icon} ${styles.navIcon}`} aria-hidden="true" />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </nav>

                <div>
                    {active === 'details' && (
                        <ProfileDetailsSection profile={profile} onSaveProfile={onSaveProfile} />
                    )}
                    {active === 'consent' && <ConsentCentreSection />}
                    {active === 'data' && <YourDataSection onAccountErased={onAccountErased} />}
                    {active === 'nominee' && <NomineeSection />}
                    {active === 'grievances' && <GrievanceSection />}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
