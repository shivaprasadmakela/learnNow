export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
    bio: string;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    level: string;
    imageUrl: string;
}

export interface UserProgress {
    id: number;
    username: string;
    lessonId: number;
    completed: boolean;
    quizScore: number | null;
    completedAt: string;
}
