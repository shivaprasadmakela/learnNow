import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Dashboard } from './Dashboard';

// useDashboard does its own fetching; stub it so this test isolates the paths-tab effect.
vi.mock('../hooks/useDashboard', () => ({
    useDashboard: () => ({
        dashboardData: null,
        isLoading: false,
        error: null,
        refreshDashboard: vi.fn()
    })
}));

/**
 * Regression cover for the infinite request loop on the Paths tab.
 *
 * The effect passed force: true, which bypasses every guard inside refreshUserData. When the
 * request failed, courses stayed empty and isCoursesLoading flipped back to false, so the
 * effect's own dependencies changed and it fired again without end.
 */
describe('Dashboard paths tab', () => {
    beforeEach(() => vi.clearAllMocks());

    const baseProps = {
        profile: { id: 'u-1', email: 'a@b.co', fullName: 'A', avatar: 'x', role: 'USER' } as never,
        onSelectPath: vi.fn()
    };

    it('fetches once when the tab opens with no paths loaded', () => {
        const refreshUserData = vi.fn();
        render(
            <Dashboard {...baseProps} activeTab="paths" courses={[]} isCoursesLoading={false}
                refreshUserData={refreshUserData} />
        );
        expect(refreshUserData).toHaveBeenCalledTimes(1);
    });

    it('does not fetch again when the request left courses empty', () => {
        const refreshUserData = vi.fn();
        const { rerender } = render(
            <Dashboard {...baseProps} activeTab="paths" courses={[]} isCoursesLoading={false}
                refreshUserData={refreshUserData} />
        );
        // Exactly the cycle that used to loop: loading toggles on, then off, and the
        // request produced nothing.
        for (let i = 0; i < 8; i++) {
            rerender(
                <Dashboard {...baseProps} activeTab="paths" courses={[]} isCoursesLoading={true}
                    refreshUserData={refreshUserData} />
            );
            rerender(
                <Dashboard {...baseProps} activeTab="paths" courses={[]} isCoursesLoading={false}
                    refreshUserData={refreshUserData} />
            );
        }
        // Before the fix this was 9+ and would have kept climbing.
        expect(refreshUserData).toHaveBeenCalledTimes(1);
    });

    it('does not fetch while another tab is active', () => {
        const refreshUserData = vi.fn();
        render(
            <Dashboard {...baseProps} activeTab="activities" courses={[]} isCoursesLoading={false}
                refreshUserData={refreshUserData} />
        );
        expect(refreshUserData).not.toHaveBeenCalled();
    });

    it('does not fetch when paths are already loaded', () => {
        const refreshUserData = vi.fn();
        render(
            <Dashboard {...baseProps} activeTab="paths" isCoursesLoading={false}
                courses={[{ id: 1, title: 'P', description: '', category: 'x', topics: [] } as never]}
                refreshUserData={refreshUserData} />
        );
        expect(refreshUserData).not.toHaveBeenCalled();
    });
});
