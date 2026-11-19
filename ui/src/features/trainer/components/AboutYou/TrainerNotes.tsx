import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteNote, type TrainerNote } from '../../api/trainer.api';
import styles from './AboutYou.module.css';

interface TrainerNotesProps {
    notes: TrainerNote[];
    onChanged: () => void;
}

/** What the trainer has noted about the learner, each one deletable. */
export const TrainerNotes: React.FC<TrainerNotesProps> = ({ notes, onChanged }) => {
    const [error, setError] = useState<string | null>(null);

    const remove = async (id: string) => {
        setError(null);
        try {
            await deleteNote(id);
            onChanged();
        } catch {
            setError('Could not delete that note. Please try again.');
        }
    };

    if (notes.length === 0) {
        return <p className={styles.muted}>Nothing yet. Notes appear as you talk to your trainer, and you can delete any of them.</p>;
    }
    return (
        <>
            <ul className={styles.notes}>
                {notes.map(n => (
                    <li key={n.id}>
                        <span className={styles.noteKind}>{n.kind}</span>
                        <span className={styles.noteText}>{n.text}</span>
                        <button type="button" className={styles.iconButton} aria-label="Delete note" onClick={() => remove(n.id)}>
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
            </ul>
            {error && <p className={styles.error} role="alert">{error}</p>}
        </>
    );
};
