import React from 'react';
import { Route } from 'lucide-react';
import styles from '../../styles/Tracks.module.css';
import type { PathTrackRef } from '../../../../types';

export interface PathTrackLinksProps {
    tracks: PathTrackRef[];
    onSelectTrack: (slug: string) => void;
}

/** "Part of: Java Full Stack Developer, Java Backend Developer" under a path's banner. */
export const PathTrackLinks: React.FC<PathTrackLinksProps> = ({ tracks, onSelectTrack }) => {
    if (tracks.length === 0) return null;
    return (
        <div className={styles.partOf}>
            <span className={styles.partOfLabel}>
                <Route size={14} aria-hidden="true" />
                Part of
            </span>
            <ul className={styles.partOfList}>
                {tracks.map(track => (
                    <li key={track.slug}>
                        <button
                            type="button"
                            className={styles.partOfLink}
                            onClick={() => onSelectTrack(track.slug)}
                        >
                            {track.title}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PathTrackLinks;
