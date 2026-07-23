import { useEffect } from 'react';
import type { UserProfile } from '../../../types';

export const useAdminGuard = (
    profile: UserProfile | null,
    changeView: (view: string) => void
) => {
    useEffect(() => {
        if (profile && profile.role !== 'ADMIN') {
            changeView('HOME');
        }
    }, [profile, changeView]);

    return { isAdmin: profile?.role === 'ADMIN' };
};
