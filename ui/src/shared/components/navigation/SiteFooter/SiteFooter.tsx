import React, { useEffect, useState } from 'react';
import {
    fetchPrivacyContact,
    type PrivacyContactDto
} from '../../../../features/privacy/api/privacy.api';
import { Logo } from '../Logo';
import type { FooterView, SiteFooterProps } from './SiteFooter.types';
import styles from './SiteFooter.module.css';

interface FooterLink {
    label: string;
    view: FooterView;
    /** Rendered only for a signed-in learner. */
    requiresAuth?: boolean;
}

interface FooterColumn {
    heading: string;
    links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
    {
        heading: 'Learn',
        links: [
            { label: 'Learning paths', view: 'PATHS' },
            { label: 'DSA sheet', view: 'DSA' },
            { label: 'Code playground', view: 'COMPILER' }
        ]
    },
    {
        heading: 'Account',
        links: [
            { label: 'Dashboard', view: 'DASHBOARD', requiresAuth: true },
            // One link rather than one per profile section. The sections are component state,
            // not routes, so "Consent settings" would land on Your details and quietly lie
            // about where it was taking you.
            { label: 'Account & privacy', view: 'PROFILE', requiresAuth: true }
        ]
    },
    {
        heading: 'Privacy',
        links: [
            { label: 'Privacy notice', view: 'PRIVACY' },
            // These stay pointed at the notice even when signed in: it is the page that explains
            // each right and carries the grievance officer's details, and it reads the same
            // whether or not you have an account. Exercising them is the account page, which the
            // column above links to.
            { label: 'Your data rights', view: 'PRIVACY' },
            { label: 'Raise a grievance', view: 'PRIVACY' }
        ]
    }
];

/**
 * The site footer.
 *
 * It exists for a specific reason beyond looking finished: until now the privacy notice was
 * reachable only from the profile dropdown, which requires being signed in. A privacy notice a
 * visitor cannot reach is not published, and the DPDP Act expects both the notice (s.5) and the
 * grievance contact (s.8(9)) to be available to someone with no account — often exactly the person
 * who needs them.
 *
 * The account column is gated on {@code isLoggedIn} and only reaches anyone on the privacy notice,
 * which is the one page carrying this footer that a signed-in learner can actually see — App
 * redirects them off both the landing and login pages. It was dropped while this was landing-only,
 * for exactly that reason, and restored when the notice gained a footer.
 *
 * The contact line is fetched rather than hardcoded, for the same reason it is configuration on
 * the server: a stale address printed on every page is a compliance failure, not stale copy. If
 * the request fails the line is omitted — a footer is not worth an error state.
 */
export const SiteFooter: React.FC<SiteFooterProps> = ({ changeView, isLoggedIn }) => {
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

    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.brandColumn}>
                    <Logo
                        variant="footer"
                        onClick={() => changeView('HOME')}
                        ariaLabel="learnNow home"
                    />
                    <p className={styles.tagline}>
                        Interactive engineering courses, a structured DSA sheet, and a playground
                        that runs your code — built for people becoming career ready.
                    </p>
                    {!isLoggedIn && (
                        <button className={styles.ctaLink} onClick={() => changeView('LOGIN')}>
                            Create a free account
                        </button>
                    )}
                </div>

                <nav className={styles.linkColumns} aria-label="Footer">
                    {COLUMNS.map(column => {
                        const links = column.links.filter(
                            link => !link.requiresAuth || isLoggedIn
                        );
                        // Account is entirely auth-gated, so for a visitor the whole column
                        // would otherwise render as a heading with nothing under it.
                        if (links.length === 0) return null;

                        return (
                            <div className={styles.column} key={column.heading}>
                                <h2 className={styles.columnHeading}>{column.heading}</h2>
                                <ul className={styles.linkList}>
                                    {links.map(link => (
                                        <li key={`${column.heading}-${link.label}`}>
                                            <button
                                                className={styles.link}
                                                onClick={() => changeView(link.view)}
                                            >
                                                {link.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className={styles.bottomBar}>
                <p className={styles.copyright}>
                    © {year} {contact?.entityName ?? 'learnNow'}. Made with{' '}
                    <span className={styles.heart}>❤</span> by the learnNow team.
                </p>

                {contact && (
                    <p className={styles.contactLine}>
                        <span className={styles.dpdpTag}>DPDP 2023</span>
                        Data protection queries:{' '}
                        <a
                            className={styles.contactLink}
                            href={`mailto:${contact.grievanceOfficerEmail}`}
                        >
                            {contact.grievanceOfficerEmail}
                        </a>
                    </p>
                )}
            </div>
        </footer>
    );
};

export default SiteFooter;
