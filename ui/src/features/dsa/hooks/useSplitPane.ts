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
 * Uses window-level pointer event listeners during dragging so resizing never drops
 * or stutters even when moving rapidly over Monaco editor or complex nested DOM.
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
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!storageKey || typeof localStorage === 'undefined') return;
        localStorage.setItem(storageKey, String(Math.round(size)));
    }, [size, storageKey]);

    useEffect(() => {
        if (!isDragging || !container) return;

        const onPointerMove = (event: PointerEvent) => {
            event.preventDefault();
            const rect = container.getBoundingClientRect();
            const fraction =
                axis === 'x'
                    ? (event.clientX - rect.left) / rect.width
                    : (event.clientY - rect.top) / rect.height;

            const next = Math.min(max, Math.max(min, fraction * 100));
            setSize(next);
        };

        const onPointerUp = () => {
            setIsDragging(false);
        };

        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        return () => {
            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };
    }, [isDragging, container, axis, min, max]);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    /** Keyboard resizing for accessibility */
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
        setContainer,
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
            onKeyDown
        }
    };
};

export default useSplitPane;
