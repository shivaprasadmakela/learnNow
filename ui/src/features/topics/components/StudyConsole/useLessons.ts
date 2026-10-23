import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { LessonOutline, SubtopicData } from '../../../../shared/api/profile.api';

/** How far outside the reading pane a lesson starts loading, so it is usually there on arrival. */
const NEAR = '300px 0px';

/**
 * The lessons of a topic, each fetched when its place in the reading feed scrolls near the screen.
 * The feed renders every lesson up to the one being read, but a finished lesson above it is only an
 * outline until the learner scrolls back to it. The active lesson loads at once - it is the one on
 * screen even before any scrolling. Each is fetched once; `load` is expected to cache.
 */
export function useLessons(
    shown: LessonOutline[],
    activeId: string | number | undefined,
    load: (id: string | number) => Promise<SubtopicData>,
    paneRef: RefObject<HTMLElement | null>
): Record<string, SubtopicData> {
    const [loaded, setLoaded] = useState<Record<string, SubtopicData>>({});
    // Lessons whose place has come near the screen; the active one is added as it is derived below.
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const ids = shown.map(s => String(s.id)).join(',');
    const active = activeId === undefined ? '' : String(activeId);
    const canObserve = typeof IntersectionObserver !== 'undefined';

    const wanted = useMemo(() => {
        // No way to tell what is on screen: load what is rendered.
        const base = canObserve ? [...seen] : ids.split(',').filter(Boolean);
        return [...new Set(active ? [...base, active] : base)].join(',');
    }, [seen, ids, active, canObserve]);

    useEffect(() => {
        const pane = paneRef.current;
        if (!pane || !canObserve) return;
        const want = (id: string) => setSeen(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) want(entry.target.id.replace('subtopic-', ''));
                });
            },
            { root: pane, rootMargin: NEAR, threshold: 0 }
        );
        ids.split(',')
            .filter(Boolean)
            .forEach(id => {
                const elem = document.getElementById(`subtopic-${id}`);
                if (elem) observer.observe(elem);
            });
        return () => observer.disconnect();
    }, [ids, paneRef, canObserve]);

    useEffect(() => {
        let cancelled = false;
        wanted.split(',').filter(Boolean).forEach(id => {
            load(id)
                .then(lesson => {
                    if (!cancelled) setLoaded(prev => (prev[id] === lesson ? prev : { ...prev, [id]: lesson }));
                })
                .catch(err => console.error('Failed to load lesson', id, err));
        });
        return () => {
            cancelled = true;
        };
    }, [wanted, load]);

    return loaded;
}
