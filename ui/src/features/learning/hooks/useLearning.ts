import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/supabaseClient';
import type { Course, Lesson, UserProgress, UserProfile } from '../types';
import * as api from '../api/learningApi';

export type ViewState = 'HOME' | 'COURSE_DETAIL' | 'LESSON_READER' | 'DASHBOARD' | 'CERTIFICATE' | 'PATHS' | 'COMING_SOON';

const toSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

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

    const [activePathSlug, setActivePathSlug] = useState<string | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

    // Sync React state with URL path (Routing)
    const handlePathChange = useCallback(async () => {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        setError(null);
        
        try {
            if (parts.length === 0) {
                setActiveView('HOME');
            } else if (parts.length === 1) {
                if (parts[0] === 'dashboard') {
                    setActiveView('DASHBOARD');
                } else if (parts[0] === 'paths') {
                    setActiveView('PATHS');
                    setActivePathSlug(null);
                } else if (parts[0] === 'certificate') {
                    setActiveView('CERTIFICATE');
                } else if (parts[0] === 'coming-soon') {
                    setActiveView('COMING_SOON');
                } else {
                    setActiveView('HOME');
                }
            } else if (parts.length === 2) {
                if (parts[0] === 'paths') {
                    setActiveView('PATHS');
                    setActivePathSlug(parts[1]);
                } else if (parts[0] === 'course') {
                    setIsLoading(true);
                    const matchedCourse = courses.find(c => toSlug(c.title) === parts[1]);
                    const courseId = matchedCourse ? matchedCourse.id : parseInt(parts[1], 10);
                    
                    if (!isNaN(courseId)) {
                        const courseDetails = await api.fetchCourseDetails(courseId);
                        setCurrentCourse(courseDetails);
                        setActiveModuleId(null);
                        setActiveView('COURSE_DETAIL');
                    } else {
                        setActiveView('HOME');
                    }
                } else if (parts[0] === 'lesson') {
                    const lessonId = parseInt(parts[1], 10);
                    if (!isNaN(lessonId)) {
                        setIsLoading(true);
                        const lessonDetails = await api.fetchLesson(lessonId);
                        setActiveLesson(lessonDetails);
                        const courseDetails = await api.fetchCourseDetails(lessonDetails.moduleId ? 5 : 1);
                        setCurrentCourse(courseDetails);
                        setActiveView('LESSON_READER');
                    }
                }
            } else if (parts.length === 3) {
                if (parts[0] === 'course') {
                    setIsLoading(true);
                    const matchedCourse = courses.find(c => toSlug(c.title) === parts[1]);
                    const courseId = matchedCourse ? matchedCourse.id : parseInt(parts[1], 10);
                    
                    if (!isNaN(courseId)) {
                        const courseDetails = await api.fetchCourseDetails(courseId);
                        setCurrentCourse(courseDetails);
                        
                        const matchedModule = courseDetails.modules?.find(m => toSlug(m.title) === parts[2]);
                        if (matchedModule) {
                            setActiveModuleId(matchedModule.id);
                            setActiveView('COURSE_DETAIL');
                        } else {
                            setActiveModuleId(null);
                            setActiveView('COURSE_DETAIL');
                        }
                    } else {
                        setActiveView('HOME');
                    }
                }
            } else if (parts.length === 4) {
                if (parts[0] === 'course') {
                    setIsLoading(true);
                    const matchedCourse = courses.find(c => toSlug(c.title) === parts[1]);
                    const courseId = matchedCourse ? matchedCourse.id : parseInt(parts[1], 10);
                    
                    if (!isNaN(courseId)) {
                        const courseDetails = await api.fetchCourseDetails(courseId);
                        setCurrentCourse(courseDetails);
                        
                        const matchedModule = courseDetails.modules?.find(m => toSlug(m.title) === parts[2]);
                        let matchedLesson: Lesson | null = null;
                        if (matchedModule && matchedModule.lessons) {
                            matchedLesson = matchedModule.lessons.find(l => toSlug(l.title) === parts[3]) || null;
                        }
                        
                        if (matchedLesson) {
                            const fullLesson = await api.fetchLesson(matchedLesson.id);
                            setActiveLesson(fullLesson);
                            setActiveView('LESSON_READER');
                        } else {
                            setActiveModuleId(matchedModule ? matchedModule.id : null);
                            setActiveView('COURSE_DETAIL');
                        }
                    } else {
                        setActiveView('HOME');
                    }
                }
            }
        } catch (err: any) {
            console.error('Routing failed:', err);
            setError(err.message || 'Failed to navigate to route');
        } finally {
            setIsLoading(false);
        }
    }, [courses]);

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
        const found = courses.find(c => c.id === courseId);
        if (found) {
            navigate(`/course/${toSlug(found.title)}`);
        } else {
            navigate(`/course/${courseId}`);
        }
    }, [navigate, courses]);

    const selectLesson = useCallback(async (lessonId: number) => {
        if (currentCourse) {
            const courseSlug = toSlug(currentCourse.title);
            let levelSlug = 'level';
            let lessonTitle = 'lesson';
            if (currentCourse.modules) {
                for (const mod of currentCourse.modules) {
                    const found = mod.lessons?.find(l => l.id === lessonId);
                    if (found) {
                        levelSlug = toSlug(mod.title);
                        lessonTitle = found.title;
                        break;
                    }
                }
            }
            navigate(`/course/${courseSlug}/${levelSlug}/${toSlug(lessonTitle)}`);
        } else {
            navigate(`/lesson/${lessonId}`);
        }
    }, [navigate, currentCourse]);

    const changeView = useCallback((view: ViewState) => {
        if (view === 'HOME') navigate('/');
        else if (view === 'DASHBOARD') navigate('/dashboard');
        else if (view === 'PATHS') navigate('/paths');
        else if (view === 'CERTIFICATE') navigate('/certificate');
        else if (view === 'COMING_SOON') navigate('/coming-soon');
        else if (view === 'COURSE_DETAIL') {
            if (currentCourse) {
                if (activeModuleId) {
                    const mod = currentCourse.modules?.find(m => m.id === activeModuleId);
                    if (mod) {
                        navigate(`/course/${toSlug(currentCourse.title)}/${toSlug(mod.title)}`);
                        return;
                    }
                }
                navigate(`/course/${toSlug(currentCourse.title)}`);
            } else {
                navigate('/');
            }
        }
        else if (view === 'LESSON_READER') {
            if (activeLesson && currentCourse) {
                let levelSlug = 'level';
                if (currentCourse.modules) {
                    const mod = currentCourse.modules.find(m => m.id === activeLesson.moduleId);
                    if (mod) levelSlug = toSlug(mod.title);
                }
                navigate(`/course/${toSlug(currentCourse.title)}/${levelSlug}/${toSlug(activeLesson.title)}`);
            } else {
                navigate('/');
            }
        }
    }, [navigate, currentCourse, activeLesson, activeModuleId]);

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
        activePathSlug,
        activeModuleId,
        setActiveModuleId,
        navigate,

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
