import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../shared/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../../../types';
import * as api from '../api/profileApi';

export type ViewState = 'HOME' | 'DASHBOARD' | 'LOGIN' | 'PATHS';

export const useProfileDashboard = () => {
    const [activeView, setActiveView] = useState<ViewState>(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);
            if (parts.length === 1 && parts[0] === 'dashboard') {
                return 'DASHBOARD';
            } else if (parts.length === 1 && parts[0] === 'login') {
                return 'LOGIN';
            } else if (parts.length === 1 && parts[0] === 'paths') {
                return 'PATHS';
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

    // Supabase Auth state variables
    const [user, setUser] = useState<User | null>(null);
    const userRef = useRef<User | null>(null);

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
        } catch (err: unknown) {
            console.error('Failed to load user profile:', err);
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
        } else if (parts.length === 1 && parts[0] === 'paths') {
            setActiveView('PATHS');
        } else {
            setActiveView('HOME');
        }
        setIsLoading(false);
    }, []);

    const changeView = useCallback((view: ViewState) => {
        if (view === 'DASHBOARD') {
            window.history.pushState(null, '', '/dashboard');
        } else if (view === 'LOGIN') {
            window.history.pushState(null, '', '/login');
        } else if (view === 'PATHS') {
            window.history.pushState(null, '', '/paths');
        } else {
            window.history.pushState(null, '', '/');
        }
        setActiveView(view);
    }, []);

    useEffect(() => {
        // Apply theme attributes
        document.documentElement.setAttribute('data-theme', theme);
        window.addEventListener('popstate', handlePathChange);
        return () => {
            window.removeEventListener('popstate', handlePathChange);
        };
    }, [handlePathChange, theme]);

    // Supabase Auth listener
    useEffect(() => {
        // Get current session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            const currentUser = currentSession?.user ?? null;
            userRef.current = currentUser;
            setUser(currentUser);
            if (currentSession) {
                loadUserData().then(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            const wasLoggedIn = userRef.current !== null;
            const currentUser = currentSession?.user ?? null;
            userRef.current = currentUser;
            setUser(currentUser);

            if (currentSession) {
                // Fetch profile only on new sign-in or session changes, avoiding repeat calls on token refresh
                if (!wasLoggedIn || event === 'SIGNED_IN') {
                    await loadUserData();
                }
                if (!wasLoggedIn && event === 'SIGNED_IN') {
                    setActiveView('DASHBOARD');
                    window.history.pushState(null, '', '/dashboard');
                }
            } else {
                setProfile(null);
                if (wasLoggedIn) {
                    setActiveView('HOME');
                    window.history.pushState(null, '', '/');
                }
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUserData]);

    // Sign up / sign in methods
    const signUp = async (email: string, pass: string, fullName: string) => {
        setError(null);
        const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        if (signUpErr) {
            setError(signUpErr.message);
            throw signUpErr;
        }
        return data;
    };

    const signIn = async (email: string, pass: string) => {
        setError(null);
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (signInErr) {
            setError(signInErr.message);
            throw signInErr;
        }
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
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
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        saveProfile,
        isLoggedIn: !!user,
        signUp,
        signIn,
        signOut
    };
};
