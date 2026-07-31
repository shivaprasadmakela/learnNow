import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../../../types';
import * as api from '../../../shared/api';
import { authClient } from '../../../shared/api/authClient';
import { apiFetch } from '../../../shared/api/client';

export type ViewState = 
    | 'HOME' 
    | 'DASHBOARD' 
    | 'LOGIN' 
    | 'PATHS' 
    | 'TOPICS' 
    | 'STUDY' 
    | 'VERIFY_EMAIL' 
    | 'COMPILER'
    | 'ADMIN' 
    | 'ADMIN_CREATE_PATH' 
    | 'ADMIN_EDIT_PATH'
    | 'ADMIN_IMPORT_COURSE';

export const useProfileDashboard = () => {
    const [editingPathId, setEditingPathId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const parts = window.location.pathname.split('/').filter(Boolean);
            if (parts.length === 3 && parts[0] === 'iamAdmin' && parts[1] === 'paths') {
                return parts[2];
            }
        }
        return null;
    });

    const [activeView, setActiveView] = useState<ViewState>(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
            if (parts.length === 1 && parts[0] === 'dashboard') {
                return 'DASHBOARD';
            } else if (parts.length === 1 && parts[0] === 'login') {
                return 'LOGIN';
            } else if (parts.length === 1 && parts[0] === 'verify-email') {
                return 'VERIFY_EMAIL';
            } else if (parts.length >= 1 && parts[0] === 'compiler') {
                return 'COMPILER';
            } else if (parts.length === 1 && parts[0] === 'paths') {
                return 'PATHS';
            } else if (parts.length === 2 && parts[0] === 'paths') {
                return 'TOPICS';
            } else if (parts.length === 3 && parts[0] === 'paths') {
                return 'STUDY';
            } else if (parts.length === 1 && parts[0] === 'iamAdmin') {
                return 'ADMIN';
            } else if (parts.length === 2 && parts[0] === 'iamAdmin' && parts[1] === 'create-path') {
                return 'ADMIN_CREATE_PATH';
            } else if (parts.length === 2 && parts[0] === 'iamAdmin' && parts[1] === 'import') {
                return 'ADMIN_IMPORT_COURSE';
            } else if (parts.length === 3 && parts[0] === 'iamAdmin' && parts[1] === 'paths') {
                return 'ADMIN_EDIT_PATH';
            }
        }
        return 'HOME';
    });
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Toggle theme
    const toggleTheme = useCallback(() => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    }, [theme]);

    // Load profile when authenticated
    const loadUserData = useCallback(async () => {
        setError(null);
        try {
            const fetchedProfile = await api.fetchProfile();
            setProfile(fetchedProfile);
            return fetchedProfile;
        } catch (err: unknown) {
            console.error('Failed to load user profile:', err);
            authClient.clearToken();
            setProfile(null);
            throw err;
        }
    }, []);

    // Sync React state with URL path
    const handlePathChange = useCallback(async () => {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        setError(null);
        
        if (parts.length === 1 && parts[0] === 'dashboard') {
            setActiveView('DASHBOARD');
        } else if (parts.length === 1 && parts[0] === 'login') {
            setActiveView('LOGIN');
        } else if (parts.length === 1 && parts[0] === 'verify-email') {
            setActiveView('VERIFY_EMAIL');
        } else if (parts.length === 1 && parts[0] === 'paths') {
            setActiveView('PATHS');
        } else if (parts.length === 2 && parts[0] === 'paths') {
            setActiveView('TOPICS');
        } else if (parts.length === 3 && parts[0] === 'paths') {
            setActiveView('STUDY');
        } else if (parts.length === 1 && parts[0] === 'iamAdmin') {
            setActiveView('ADMIN');
        } else if (parts.length === 2 && parts[0] === 'iamAdmin' && parts[1] === 'create-path') {
            setActiveView('ADMIN_CREATE_PATH');
        } else if (parts.length === 2 && parts[0] === 'iamAdmin' && parts[1] === 'import') {
            setActiveView('ADMIN_IMPORT_COURSE');
        } else if (parts.length === 3 && parts[0] === 'iamAdmin' && parts[1] === 'paths') {
            setEditingPathId(parts[2]);
            setActiveView('ADMIN_EDIT_PATH');
        } else {
            setActiveView('HOME');
        }
        setIsLoading(false);
    }, []);

    const changeView = useCallback((view: ViewState, slug?: string, subtopicSlug?: string) => {
        if (view === 'DASHBOARD') {
            window.history.pushState(null, '', '/dashboard');
        } else if (view === 'LOGIN') {
            window.history.pushState(null, '', '/login');
        } else if (view === 'VERIFY_EMAIL') {
            window.history.pushState(null, '', `/verify-email${slug ? '?token=' + slug : ''}`);
        } else if (view === 'COMPILER') {
            window.history.pushState(null, '', `/compiler/${slug || 'javascript'}`);
        } else if (view === 'PATHS') {
            window.history.pushState(null, '', '/paths');
        } else if (view === 'TOPICS') {
            window.history.pushState(null, '', `/paths/${slug || 'java-backend-path'}`);
        } else if (view === 'STUDY') {
            window.history.pushState(null, '', `/paths/${slug || 'java-backend-path'}/${subtopicSlug || ''}`);
        } else if (view === 'ADMIN') {
            window.history.pushState(null, '', '/iamAdmin');
        } else if (view === 'ADMIN_CREATE_PATH') {
            window.history.pushState(null, '', '/iamAdmin/create-path');
        } else if (view === 'ADMIN_IMPORT_COURSE') {
            window.history.pushState(null, '', '/iamAdmin/import');
        } else if (view === 'ADMIN_EDIT_PATH') {
            if (slug) setEditingPathId(slug);
            window.history.pushState(null, '', `/iamAdmin/paths/${slug || ''}`);
        } else {
            window.history.pushState(null, '', '/');
        }
        setActiveView(view);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        window.addEventListener('popstate', handlePathChange);
        return () => {
            window.removeEventListener('popstate', handlePathChange);
        };
    }, [handlePathChange, theme]);

    useEffect(() => {
        const token = authClient.getToken();
        if (token) {
            loadUserData()
                .then(() => setIsLoading(false))
                .catch(() => {
                    setIsLoading(false);
                    changeView('LOGIN');
                });
        } else {
            setIsLoading(false);
        }
    }, [loadUserData, changeView]);

    const getErrorMessage = async (response: Response, fallback: string): Promise<string> => {
        try {
            const data = await response.json();
            return data.message || fallback;
        } catch {
            try {
                const text = await response.text();
                return text || fallback;
            } catch {
                return fallback;
            }
        }
    };

    const signUp = async (firstName: string, lastName: string, email: string, pass: string) => {
        setError(null);
        const response = await apiFetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password: pass
            })
        });

        if (!response.ok) {
            const errText = await getErrorMessage(response, 'Registration failed');
            setError(errText);
            throw new Error(errText);
        }
    };

    const signIn = async (email: string, pass: string) => {
        setError(null);
        const response = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: pass
            })
        });

        if (!response.ok) {
            const errText = await getErrorMessage(response, 'Invalid email or password');
            setError(errText);
            throw new Error(errText);
        }

        const data = await response.json();
        authClient.setToken(data.token);
        setProfile(data.profile);
        
        changeView('DASHBOARD');
        window.history.pushState(null, '', '/dashboard');
        return data;
    };

    const handleLoginSuccess = useCallback((token: string, profile: UserProfile) => {
        authClient.setToken(token);
        setProfile(profile);
        changeView('DASHBOARD');
        window.history.pushState(null, '', '/dashboard');
    }, [changeView]);

    const signOut = async () => {
        authClient.clearToken();
        setProfile(null);
        changeView('HOME');
    };

    const saveProfile = async (fullName: string, avatar: string, role: string, bio: string) => {
        if (!profile) return;
        try {
            const updated = await api.updateProfile({
                ...profile,
                fullName,
                avatar,
                role,
                bio
            });
            setProfile(updated);
        } catch (err: unknown) {
            console.error('Failed to update profile:', err);
            const message = err instanceof Error ? err.message : 'Failed to update profile';
            setError(message);
        }
    };

    return {
        activeView,
        changeView,
        editingPathId,
        setEditingPathId,
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        saveProfile,
        isLoggedIn: !!profile,
        signUp,
        signIn,
        signOut,
        handleLoginSuccess
    };
};
