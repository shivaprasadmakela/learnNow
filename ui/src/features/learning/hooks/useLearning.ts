import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/supabaseClient';
import type { Course, Lesson, UserProgress, UserProfile } from '../types';
import * as api from '../api/learningApi';

export type ViewState = 'HOME' | 'COURSE_DETAIL' | 'LESSON_READER' | 'DASHBOARD' | 'CERTIFICATE' | 'PATHS';

export const useLearning = () => {
    const [activeView, setActiveView] = useState<ViewState>('HOME');
    const [courses, setCourses] = useState<Course[]>([]);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Supabase Auth state variables
    const [session, setSession] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

    // Toggle theme
    const toggleTheme = useCallback(() => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    }, [theme]);

    // Initial load of courses
    const loadCoursesOnly = useCallback(async () => {
        try {
            const fetchedCourses = await api.fetchCourses();
            setCourses(fetchedCourses);
        } catch (err: any) {
            console.error('Failed to fetch courses:', err);
            setError(err.message || 'Connection error: Spring Boot backend could not be reached.');
        }
    }, []);

    // Load progress and profile when authenticated
    const loadUserData = useCallback(async () => {
        setError(null);
        try {
            const [fetchedProgress, fetchedProfile] = await Promise.all([
                api.fetchProgress(),
                api.fetchProfile()
            ]);
            setProgress(fetchedProgress);
            setProfile(fetchedProfile);
        } catch (err: any) {
            console.error('Failed to load user progress and profile:', err);
            // Don't show critical connection error banner if it's just profile auth failing temporarily
        }
    }, []);

    // Sync React state with URL path (Routing)
    const handlePathChange = useCallback(async () => {
        const path = window.location.pathname;
        setError(null);
        
        try {
            if (!path || path === '/' || path === '') {
                setActiveView('HOME');
            } else if (path === '/dashboard') {
                setActiveView('DASHBOARD');
            } else if (path === '/paths') {
                setActiveView('PATHS');
            } else if (path === '/certificate') {
                setActiveView('CERTIFICATE');
            } else if (path.startsWith('/course/')) {
                const courseId = parseInt(path.replace('/course/', ''), 10);
                if (!isNaN(courseId)) {
                    setIsLoading(true);
                    const courseDetails = await api.fetchCourseDetails(courseId);
                    setCurrentCourse(courseDetails);
                    setActiveView('COURSE_DETAIL');
                }
            } else if (path.startsWith('/lesson/')) {
                const lessonId = parseInt(path.replace('/lesson/', ''), 10);
                if (!isNaN(lessonId)) {
                    setIsLoading(true);
                    const lessonDetails = await api.fetchLesson(lessonId);
                    setActiveLesson(lessonDetails);
                    
                    // Ensure we have currentCourse details loaded for syllabus structure
                    if (!currentCourse || currentCourse.id !== 1) {
                        const courseDetails = await api.fetchCourseDetails(1);
                        setCurrentCourse(courseDetails);
                    }
                    setActiveView('LESSON_READER');
                }
            }
        } catch (err: any) {
            console.error('Routing failed:', err);
            setError(err.message || 'Failed to navigate to route');
        } finally {
            setIsLoading(false);
        }
    }, [currentCourse]);

    const navigate = useCallback((path: string) => {
        window.history.pushState(null, '', path);
        handlePathChange();
    }, [handlePathChange]);

    // Handle routing changes and initial load
    useEffect(() => {
        loadCoursesOnly();

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, [loadCoursesOnly]);

    useEffect(() => {
        if (courses.length > 0) {
            handlePathChange();
        }

        window.addEventListener('popstate', handlePathChange);
        return () => {
            window.removeEventListener('popstate', handlePathChange);
        };
    }, [courses, handlePathChange]);

    // Supabase Auth listener
    useEffect(() => {
        setIsLoading(true);
        
        // Get current session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession) {
                loadUserData().then(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            const wasLoggedIn = !!user;

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession) {
                await loadUserData();
                if (!wasLoggedIn && event === 'SIGNED_IN') {
                    // Redirect to dashboard after login
                    setActiveView('DASHBOARD');
                    navigate('/dashboard');
                }
            } else {
                setProgress([]);
                setProfile(null);
                if (wasLoggedIn) {
                    setActiveView('HOME');
                    navigate('/');
                }
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUserData, navigate]);

    const selectCourse = useCallback(async (courseId: number) => {
        navigate(`/course/${courseId}`);
    }, [navigate]);

    const selectLesson = useCallback(async (lessonId: number) => {
        navigate(`/lesson/${lessonId}`);
    }, [navigate]);

    const changeView = useCallback((view: ViewState) => {
        if (view === 'HOME') navigate('/');
        else if (view === 'DASHBOARD') navigate('/dashboard');
        else if (view === 'PATHS') navigate('/paths');
        else if (view === 'CERTIFICATE') navigate('/certificate');
        else if (view === 'COURSE_DETAIL') {
            if (currentCourse) navigate(`/course/${currentCourse.id}`);
            else navigate('/');
        }
        else if (view === 'LESSON_READER') {
            if (activeLesson) navigate(`/lesson/${activeLesson.id}`);
            else navigate('/');
        }
    }, [navigate, currentCourse, activeLesson]);

    const signUp = async (email: string, pass: string, fullName: string) => {
        const { data, error: err } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        if (err) throw err;
        return data;
    };

    const signIn = async (email: string, pass: string) => {
        const { data, error: err } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (err) throw err;
        return data;
    };

    const signOut = async () => {
        const { error: err } = await supabase.auth.signOut();
        if (err) throw err;
    };

    const signInWithGoogle = async () => {
        const { data, error: err } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (err) throw err;
        return data;
    };

    const markLessonCompleted = async (lessonId: number) => {
        try {
            const updatedProgress = await api.completeLesson(lessonId);
            setProgress(prev => {
                const idx = prev.findIndex(p => p.lessonId === lessonId);
                if (idx > -1) {
                    const next = [...prev];
                    next[idx] = updatedProgress;
                    return next;
                }
                return [...prev, updatedProgress];
            });
        } catch (err: any) {
            console.error('Failed to update progress:', err);
        }
    };

    const submitQuiz = async (lessonId: number, score: number) => {
        try {
            const updatedProgress = await api.submitQuizScore(lessonId, score);
            setProgress(prev => {
                const idx = prev.findIndex(p => p.lessonId === lessonId);
                if (idx > -1) {
                    const next = [...prev];
                    next[idx] = updatedProgress;
                    return next;
                }
                return [...prev, updatedProgress];
            });
        } catch (err: any) {
            console.error('Failed to submit quiz score:', err);
        }
    };

    const resetAllProgress = async () => {
        setIsLoading(true);
        try {
            await api.resetProgress();
            const freshProgress = await api.fetchProgress();
            setProgress(freshProgress);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Failed to reset progress:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveProfile = async (fullName: string, avatar: string, role: string, bio: string) => {
        if (!profile) return;
        setIsLoading(true);
        try {
            const updatedProfile = await api.updateProfile({
                ...profile,
                fullName,
                avatar,
                role,
                bio
            });
            setProfile(updatedProfile);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        activeView,
        changeView,
        courses,
        currentCourse,
        activeLesson,
        progress,
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        selectCourse,
        selectLesson,
        markLessonCompleted,
        submitQuiz,
        resetAllProgress,
        saveProfile,
        refreshInitialData: loadUserData,

        // Auth properties
        session,
        user,
        isLoggedIn: !!user,
        authModalOpen,
        setAuthModalOpen,
        signUp,
        signIn,
        signOut,
        signInWithGoogle
    };
};

export type UseLearningReturn = ReturnType<typeof useLearning>;
