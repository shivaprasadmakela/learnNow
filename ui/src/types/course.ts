export interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: string;
    level: string;
    imageUrl: string;
    managedBy?: string;
}

export interface UserProgress {
    id: number;
    username: string;
    lessonId: number;
    completed: boolean;
    quizScore: number | null;
    completedAt: string;
}
