import React, { useCallback, useRef } from 'react';
import styles from './Tabs.module.css';

export type TabsVariant = 'underline' | 'compact' | 'pill';

export interface TabItem<T extends string = string> {
    id: T;
    label: string;
    /** Rendered before the label. Pass a sized lucide icon. */
    icon?: React.ReactNode;
    /** Shown after the label — a result count, usually. */
    count?: number;
    disabled?: boolean;
    /** Falls back to the label. */
    title?: string;
}

export interface TabsProps<T extends string = string> {
    items: TabItem<T>[];
    activeId: T;
    onChange: (id: T) => void;
    /** See Tabs.module.css for what each variant is for. Defaults to the dashboard's underline. */
    variant?: TabsVariant;
    /** Names the tab group for screen readers. */
    label?: string;
    className?: string;
}

/**
 * One tab bar for the whole application.
 *
 * This replaced four hand-written tab bars that had accumulated independently — the dashboard's
 * section switcher, the admin studio's, the problem workspace's pane switcher and the bookmark
 * filter. They differed only in padding and in whether the active tab was underlined or filled, so
 * the differences became variants and the behaviour became shared.
 *
 * That behaviour is the part worth having in one place: arrow keys move between tabs, Home and End
 * jump to the ends, and the roving `tabIndex` means the group is one tab stop rather than one per
 * tab. None of the four originals did any of it.
 */
export const Tabs = <T extends string = string>({
    items,
    activeId,
    onChange,
    variant = 'underline',
    label,
    className = ''
}: TabsProps<T>) => {
    const refs = useRef<Record<string, HTMLButtonElement | null>>({});

    const move = useCallback(
        (from: number, delta: number) => {
            const enabled = items.filter(item => !item.disabled);
            if (enabled.length === 0) return;

            const currentIndex = enabled.findIndex(item => item.id === items[from]?.id);
            const start = currentIndex === -1 ? 0 : currentIndex;
            // Wraps, so End-then-right returns to the first tab rather than dead-ending.
            const next = enabled[(start + delta + enabled.length) % enabled.length];
            onChange(next.id);
            refs.current[next.id]?.focus();
        },
        [items, onChange]
    );

    const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                move(index, 1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                move(index, -1);
                break;
            case 'Home': {
                event.preventDefault();
                const first = items.find(item => !item.disabled);
                if (first) {
                    onChange(first.id);
                    refs.current[first.id]?.focus();
                }
                break;
            }
            case 'End': {
                event.preventDefault();
                const last = [...items].reverse().find(item => !item.disabled);
                if (last) {
                    onChange(last.id);
                    refs.current[last.id]?.focus();
                }
                break;
            }
            default:
                break;
        }
    };

    return (
        <div
            role="tablist"
            aria-label={label}
            className={`${styles.tablist} ${styles[variant]} ${className}`.trim()}
        >
            {items.map((item, index) => {
                const isActive = item.id === activeId;
                return (
                    <button
                        key={item.id}
                        ref={node => {
                            refs.current[item.id] = node;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        disabled={item.disabled}
                        // Roving tabIndex: the group is a single tab stop, and arrow keys move
                        // within it. This is what the ARIA tabs pattern expects.
                        tabIndex={isActive ? 0 : -1}
                        title={item.title ?? item.label}
                        className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                        onClick={() => onChange(item.id)}
                        onKeyDown={event => onKeyDown(event, index)}
                    >
                        {item.icon}
                        {item.label}
                        {typeof item.count === 'number' && (
                            <span className={styles.count}>{item.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
