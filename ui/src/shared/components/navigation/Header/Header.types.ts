export interface HeaderUserProfile {
    id?: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
}

export interface HeaderProps {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    changeView: (view: 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS' | 'TOPICS') => void;
    profile: HeaderUserProfile | null;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoggedIn: boolean;
    signOut: () => Promise<void>;
    onOpenSettings?: () => void;
    points?: number;
    streak?: number;
}
