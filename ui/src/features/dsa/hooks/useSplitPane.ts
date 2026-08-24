import { useCallback, useEffect, useState } from 'react';

export interface UseSplitPaneOptions {
    /** Starting size as a percentage of the container. */
    initial: number;
    min?: number;
    max?: number;
    axis?: 'x' | 'y';
    /** Persists the size under this key, so a resize survives a reload. */
    storageKey?: string;
}

/**
 * A draggable divider between two panes.
 *
 * Pointer events rather than mouse events, so a stylus or touch drag works the same way, and
 * `setPointerCapture` means the drag survives the pointer leaving the 6px gutter — without it the
 * divider drops the moment you move faster than the render.
 */
export const useSplitPane = ({
    initial,
    min = 20,
    max = 80,
    axis = 'x',
    storageKey
}: UseSplitPaneOptions) => {
    const [size, setSize] = useState<number>(() => {
        if (storageKey && typeof localStorage !== 'undefined') {
            const saved = Number(localStorage.getItem(storageKey));
            if (Number.isFinite(saved) && saved >= min && saved <= max) return saved;
        }
        return initial;
    });
    const [isDragging, setIsDragging] = useState(false);
    /**
     * The container is held in state rather than a ref object, so the caller attaches it with a
     * plain callback ref and there is nothing to cast. Same shape as `useInfiniteScroll`.
     */
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!storageKey || typeof localStorage === 'undefined') return;
        localStorage.setItem(storageKey, String(Math.round(size)));
    }, [size, storageKey]);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
    }, []);

    const onPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging || !container) return;

            const rect = container.getBoundingClientRect();
            const fraction =
                axis === 'x'
                    ? (event.clientX - rect.left) / rect.width
                    : (event.clientY - rect.top) / rect.height;

            const next = Math.min(max, Math.max(min, fraction * 100));
            setSize(next);
        },
        [isDragging, container, axis, min, max]
    );

    const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setIsDragging(false);
    }, []);

    /** Keyboard resizing, because a drag handle nobody can tab to is not a control. */
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const back = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
            const forward = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
            if (event.key !== back && event.key !== forward) return;
            event.preventDefault();
            setSize(prev =>
                Math.min(max, Math.max(min, prev + (event.key === back ? -2 : 2)))
            );
        },
        [axis, min, max]
    );

    return {
        size,
        isDragging,
        /** Attach to the element the divider divides. */
        setContainer,
        /** Spread onto the gutter element. */
        gutterProps: {
            role: 'separator' as const,
            'aria-orientation': (axis === 'x' ? 'vertical' : 'horizontal') as
                | 'vertical'
                | 'horizontal',
            'aria-valuenow': Math.round(size),
            'aria-valuemin': min,
            'aria-valuemax': max,
            tabIndex: 0,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onKeyDown
        }
    };
};

export default useSplitPane;
