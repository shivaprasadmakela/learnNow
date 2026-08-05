import React from 'react';
import styles from './YouTubeEmbed.module.css';

interface YouTubeEmbedProps {
    url: string;
}

export function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url }) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;

    return (
        <div className={styles.embedContainer}>
            <iframe
                className={styles.iframe}
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title="Subtopic Video Explanation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};
