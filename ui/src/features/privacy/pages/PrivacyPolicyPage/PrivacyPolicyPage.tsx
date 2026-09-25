import React, { useEffect, useState } from 'react';
import { SiteFooter } from '../../../../shared/components/navigation/SiteFooter';
import type { FooterView } from '../../../../shared/components/navigation/SiteFooter';
import { fetchPrivacyContact, type PrivacyContactDto } from '../../api/privacy.api';
import styles from './PrivacyPolicyPage.module.css';

interface PrivacyPolicyPageProps {
    /** Sends a signed-in learner to the matching control instead of just describing it. */
    onOpenProfile?: () => void;
    isLoggedIn?: boolean;
    /** Drives the footer. Absent means the footer is left off, which keeps this page standalone. */
    changeView?: (view: FooterView) => void;
}

/**
 * The privacy notice required by s.5 of the DPDP Act.
 *
 * Two things about this file are deliberate.
 *
 * The entity name, officer and address are fetched rather than written here, for the same reason
 * the backend keeps them in configuration: they are business facts that change without a deploy,
 * and a notice naming the wrong contact is a compliance failure rather than stale copy.
 *
 * The text describes what this application actually does, taken from the schema rather than from a
 * template — the categories listed under "What we collect" are the real tables. A notice that
 * describes a generic website is not a notice about this one, and s.5 asks for the specific
 * personal data and the specific purposes.
 *
 * It has not been through legal review. The structure and the substance are right for the Act, but
 * signing it off is not something code can do.
 */
export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
    onOpenProfile,
    isLoggedIn,
    changeView
}) => {
    const [contact, setContact] = useState<PrivacyContactDto | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchPrivacyContact()
            .then(data => {
                if (!cancelled) setContact(data);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const entity = contact?.entityName ?? 'learnNow';

    return (
        <div className={styles.shell}>
            <div className={styles.page}>
                <h1 className={styles.title}>Privacy notice</h1>
                <p className={styles.subtitle}>
                    What {entity} collects about you, why, and what you can do about it. Written to meet
                    the Digital Personal Data Protection Act, 2023.
                </p>

                <div className={styles.meta}>
                    {contact ? `Notice version ${contact.noticeVersion}` : 'Loading notice version…'}
                </div>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Who is responsible</h2>
                    <p>
                        {entity} is the Data Fiduciary for the personal data described here. That means
                        we decide why and how it is processed, and we are accountable for it under the
                        Act.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>What we collect</h2>
                    <p>Only what the platform needs to work. Specifically:</p>
                    <ul className={styles.list}>
                        <li>
                            <strong>Your account.</strong> Name, email address, an avatar, and an
                            optional bio. If you sign in with Google we receive your name, email address
                            and profile picture from Google. If you use a password we store it hashed —
                            we cannot read it.
                        </li>
                        <li>
                            <strong>What you have studied.</strong> Which topics and lessons you have
                            completed, quiz attempts and whether they were right, points, streaks, and
                            the days you were active.
                        </li>
                        <li>
                            <strong>Your work.</strong> Notes you write, topics and problems you
                            bookmark, and the code you submit against DSA problems, along with its
                            result.
                        </li>
                        <li>
                            <strong>Your choices.</strong> What you consented to, when, and against
                            which version of this notice. We keep the history so we can show what you
                            agreed to, including consent you have since withdrawn.
                        </li>
                        <li>
                            <strong>Anything you send us.</strong> Grievances you raise, and a nominee
                            if you name one.
                        </li>
                        <li>
                            <strong>Donations.</strong> If you donate, the name, email address and
                            message you type into the donation form, and the payment reference.
                        </li>
                    </ul>
                    <p>
                        We do not collect location, contacts, biometrics, or anything about you from
                        other websites, and we do not buy data about you from anyone.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why we process it</h2>
                    <p>
                        Each purpose below is a separate consent, and you can change any of them without
                        affecting the others.
                    </p>
                    <ul className={styles.list}>
                        <li>
                            <strong>Running your account.</strong> Signing you in, saving your progress,
                            and sending service email such as password resets and email verification.
                            This one cannot be switched off while you have an account, because it is
                            what an account is. Closing your account withdraws it.
                        </li>
                        <li>
                            <strong>Improving the courses.</strong> Understanding which lessons people
                            finish and where they get stuck. Never used to target advertising.
                        </li>
                        <li>
                            <strong>Course announcements.</strong> Occasional email about new material.
                            Off unless you turn it on.
                        </li>
                        <li>
                            <strong>Recommendations.</strong> Using what you have studied to suggest
                            what to study next.
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Your rights</h2>
                    <p>
                        The Act gives you these, and all of them work from your account page — you do
                        not have to email anyone to use them.
                    </p>

                    <div className={styles.rights}>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Know what we hold <span className={styles.rightRef}>s.11</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Download everything above as a single file, whenever you want.
                            </p>
                        </div>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Correct it <span className={styles.rightRef}>s.12</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Change your name, avatar and bio directly. For your email address, raise
                                a grievance and we will do it.
                            </p>
                        </div>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Have it erased <span className={styles.rightRef}>s.12</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Delete your account and everything attached to it, immediately. Payment
                                records are kept because tax law requires it, with your name and email
                                removed from them.
                            </p>
                        </div>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Withdraw consent <span className={styles.rightRef}>s.6</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Turn off any optional purpose with one switch. It takes effect
                                immediately and is exactly as easy as turning it on.
                            </p>
                        </div>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Complain <span className={styles.rightRef}>s.13</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Raise a grievance and follow what happened to it. If you are not
                                satisfied, you may escalate to the Data Protection Board of India.
                            </p>
                        </div>
                        <div className={styles.right}>
                            <h3 className={styles.rightTitle}>
                                Nominate someone <span className={styles.rightRef}>s.14</span>
                            </h3>
                            <p className={styles.rightBody}>
                                Name a person who may exercise these rights for you if you die or become
                                unable to.
                            </p>
                        </div>
                    </div>

                    {isLoggedIn && onOpenProfile && (
                        <p>
                            <button className={styles.inlineLink} onClick={onOpenProfile}>
                                Open your account page
                            </button>{' '}
                            to use any of these now.
                        </p>
                    )}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Who else sees it</h2>
                    <p>
                        We do not sell your data and we do not share it for anyone else&rsquo;s
                        marketing. We use a small number of processors to run the service, and they only
                        handle what their job needs:
                    </p>
                    <ul className={styles.list}>
                        <li>
                            <strong>Google</strong> — only if you choose to sign in with Google.
                        </li>
                        <li>
                            <strong>Our email provider</strong> — to deliver verification, password
                            reset and announcement email.
                        </li>
                        <li>
                            <strong>Our payment gateway</strong> — only if you donate. Card details go
                            to them directly and never reach us.
                        </li>
                        <li>
                            <strong>Our code execution service</strong> — runs the code you write in the
                            playground and against DSA problems.
                        </li>
                        <li>
                            <strong>Our hosting and database providers</strong> — store the data
                            described above.
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>How long we keep it</h2>
                    <p>
                        Your account data stays while your account exists. Delete your account and it
                        goes immediately, apart from payment records we are legally required to keep,
                        which we strip of anything identifying you. Sign-in tokens and password reset
                        links expire on their own and are cleared automatically.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Children</h2>
                    <p>
                        This platform is not intended for anyone under 18. We do not knowingly collect
                        data about children, and we do not profile or advertise to them. If you believe
                        a child has created an account, tell us using the contact below and we will
                        remove it.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Keeping it safe</h2>
                    <p>
                        Passwords are hashed and never stored in a readable form. Sign-in tokens are
                        stored only as hashes, so a copy of our database cannot be used to sign in as
                        you. Everything travels over an encrypted connection. If a breach affects your
                        data, we will tell you and the Data Protection Board, as the Act requires.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Contact us</h2>
                    <div className={styles.contactBlock}>
                        {contact ? (
                            <>
                                <strong>{contact.grievanceOfficerName}</strong>
                                <br />
                                {contact.entityName}
                                <br />
                                <a href={`mailto:${contact.grievanceOfficerEmail}`}>
                                    {contact.grievanceOfficerEmail}
                                </a>
                                <br />
                                {contact.grievanceOfficerAddress}
                                <br />
                                <br />
                                We aim to respond within {contact.grievanceResponseDays} days.
                            </>
                        ) : (
                            'Loading contact details…'
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Changes to this notice</h2>
                    <p>
                        Every version of this notice is numbered, and each consent you give is recorded
                        against the version that was on screen at the time. If we change it materially
                        we will tell you and ask again where the change affects what you agreed to.
                    </p>
                </section>
            </div>

            {/*
              * The one page carrying this footer that a signed-in learner can reach, so its
              * account column is the only place that column ever shows.
              */}
            {changeView && (
                <SiteFooter changeView={changeView} isLoggedIn={Boolean(isLoggedIn)} />
            )}
        </div>
    );
};

export default PrivacyPolicyPage;
