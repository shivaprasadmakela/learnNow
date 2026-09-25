export interface UserProfile {
    id: string;
    username: string;
    /**
     * Returned by /api/user and by the login response, but absent from this type until the
     * account page needed to show it. Optional because older cached profiles in localStorage
     * predate it.
     */
    email?: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
    streakCount?: number;
    gemsCount?: number;
    points?: number;
}
