import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import styles from './DsaProblemEditorModal.module.css';

export interface ListEditorProps<T> {
    items: T[];
    onChange: (next: T[]) => void;
    /** Produces a fresh, empty item for the add button. */
    blank: () => T;
    /** Renders one item's fields. Reordering and removal are supplied around it. */
    renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
    /** The heading on each card, e.g. `index => \`Hint ${index + 1}\``. */
    itemLabel: (index: number) => string;
    addLabel: string;
    emptyText: string;
}

/**
 * An ordered, editable list of anything.
 *
 * Hints, approaches and test cases are all the same interaction — add, remove, move up, move down,
 * and a position that is part of the content rather than incidental to it. They were three copies
 * of this before it existed.
 *
 * Order matters in every one of them: hints unlock in sequence, approaches step from brute force to
 * optimal, and a test case's index is what a verdict points at. So reordering is a first-class
 * control here rather than something to do by cutting and pasting text between fields.
 */
export const ListEditor = <T,>({
    items,
    onChange,
    blank,
    renderItem,
    itemLabel,
    addLabel,
    emptyText
}: ListEditorProps<T>) => {
    const move = (from: number, to: number) => {
        if (to < 0 || to >= items.length) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
    };

    const update = (index: number, patch: Partial<T>) => {
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    return (
        <div className={styles.list}>
            {items.length === 0 && <p className={styles.empty}>{emptyText}</p>}

            {items.map((item, index) => (
                <section key={index} className={styles.card}>
                    <header className={styles.cardHead}>
                        <span className={styles.cardTitle}>{itemLabel(index)}</span>
                        <div className={styles.cardActions}>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => move(index, index - 1)}
                                disabled={index === 0}
                                title="Move up"
                                aria-label={`Move ${itemLabel(index)} up`}
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => move(index, index + 1)}
                                disabled={index === items.length - 1}
                                title="Move down"
                                aria-label={`Move ${itemLabel(index)} down`}
                            >
                                <ArrowDown size={14} />
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => onChange(items.filter((_, i) => i !== index))}
                                title="Remove"
                                aria-label={`Remove ${itemLabel(index)}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </header>
                    <div className={styles.cardBody}>
                        {renderItem(item, index, patch => update(index, patch))}
                    </div>
                </section>
            ))}

            <button
                type="button"
                className={styles.addBtn}
                onClick={() => onChange([...items, blank()])}
            >
                <Plus size={14} /> {addLabel}
            </button>
        </div>
    );
};

export default ListEditor;
