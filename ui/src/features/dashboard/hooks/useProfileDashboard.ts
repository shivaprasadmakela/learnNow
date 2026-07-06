import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/supabaseClient';
import type { UserProfile } from '../types';
import * as api from '../api/profileApi';

export type ViewState = 'DASHBOARD';

export const useProfileDashboard = () => {
    const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Supabase Auth state variables
    const [user, setUser] = useState<any>(null);
    const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

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
        } catch (err: any) {
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
        } else {
            setActiveView('DASHBOARD');
        }
        setIsLoading(false);
    }, []);

    const navigate = useCallback((path: string) => {
        window.history.pushState(null, '', path);
        handlePathChange();
    }, [handlePathChange]);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        handlePathChange();
        window.addEventListener('popstate', handlePathChange);
        return () => {
            window.removeEventListener('popstate', handlePathChange);
        };
    }, [handlePathChange]);

    // Supabase Auth listener
    useEffect(() => {
        setIsLoading(true);

        // Get current session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setUser(currentSession?.user ?? null);
            if (currentSession) {
                loadUserData().then(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            setUser(currentSession?.user ?? null);

            if (currentSession) {
                await loadUserData();
                if (event === 'SIGNED_IN') {
                    setActiveView('DASHBOARD');
                    navigate('/dashboard');
                }
            } else {
                setProfile(null);
                if (event === 'SIGNED_OUT') {
                    setActiveView('DASHBOARD');
                    navigate('/');
                }
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUserData, navigate]);

    // Sign up / sign in methods
    const signUp = async (email: string) => {
        setError(null);
        const { error: signUpErr } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (signUpErr) {
            setError(signUpErr.message);
            throw signUpErr;
        }
    };

    const signIn = async (email: string) => {
        setError(null);
        const { error: signInErr } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (signInErr) {
            setError(signInErr.message);
            throw signInErr;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        navigate('/');
    };

    const signInWithGoogle = async () => {
        setError(null);
        const { error: googleErr } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (googleErr) {
            setError(googleErr.message);
            throw googleErr;
        }
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
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError(err.message || 'Failed to update profile');
        }
    };

    return {
        activeView,
        changeView: setActiveView,
        profile,
        isLoading,
        error,
        theme,
        toggleTheme,
        saveProfile,
        isLoggedIn: !!user,
        authModalOpen,
        setAuthModalOpen,
        signUp,
        signIn,
        signOut,
        signInWithGoogle
    };
};
