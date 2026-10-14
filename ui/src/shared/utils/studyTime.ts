/**
 * A path's estimated study time, from the minutes its published lessons are authored with.
 *
 * Undefined when nothing is known - a visitor on an old backend, or a path with no lessons yet - so
 * the caller leaves the line out rather than printing "0 min".
 */
export function formatStudyTime(minutes: number | undefined): string | undefined {
    if (!minutes || minutes <= 0) return undefined;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
