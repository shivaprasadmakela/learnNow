export interface HeaderUserProfile {
    id?: string;
    /** Shown under the name in the account menu. */
    email?: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
}

export interface HeaderProps {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    changeView: (
        view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS' | 'PROFILE' | 'PRIVACY'
    ) => void;
    profile: HeaderUserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoggedIn: boolean;
    signOut: () => Promise<void>;
    points?: number;
    streak?: number;
}
