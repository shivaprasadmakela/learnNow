import type { HeaderUserProfile } from '../../Header.types';

export interface ProfileMenuProps {
    profile: HeaderUserProfile | null;
    changeView: (
        view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS' | 'PROFILE' | 'PRIVACY'
    ) => void;
    signOut: () => Promise<void>;
    onOpenSettings?: () => void;
}
