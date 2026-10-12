import type { HeaderUserProfile } from '../../Header.types';

export interface ProfileMenuProps {
    profile: HeaderUserProfile | null;
    changeView: (view: 'PROFILE' | 'PRIVACY') => void;
    signOut: () => Promise<void>;
}
