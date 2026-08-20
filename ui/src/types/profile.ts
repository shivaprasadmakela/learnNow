export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
    streakCount?: number;
    gemsCount?: number;
    points?: number;
}
