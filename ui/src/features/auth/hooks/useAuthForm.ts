import { useState } from 'react';
import { useToast } from '../../../shared/components/feedback/Toast';

interface UseAuthFormProps {
    signIn: (email: string, pass: string) => Promise<unknown>;
    signUp: (firstName: string, lastName: string, email: string, pass: string) => Promise<unknown>;
}

export function useAuthForm({ signIn, signUp }: UseAuthFormProps) {
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

    // Form inputs state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Create Account form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const validateEmail = (val: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val);
    };

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            showToast('Email is required.', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        if (!password) {
            showToast('Password is required.', 'error');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err: unknown) {
            console.error('Sign in error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during sign in. Please check your credentials.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim()) {
            showToast('First name is required.', 'error');
            return;
        }
        if (!lastName.trim()) {
            showToast('Last name is required.', 'error');
            return;
        }
        if (!email) {
            showToast('Email is required.', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        if (!password) {
            showToast('Password is required.', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }
        if (password !== passwordConfirmation) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        setLoading(true);
        try {
            await signUp(firstName.trim(), lastName.trim(), email, password);
            setIsRegisteredSuccess(true);

            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            const message = err instanceof Error ? err.message : 'An error occurred during registration. Please try again.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
    };

    return {
        isSignUp,
        loading,
        isRegisteredSuccess,
        setIsRegisteredSuccess,
        setIsSignUp,
        email,
        setEmail,
        password,
        setPassword,
        rememberMe,
        setRememberMe,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        passwordConfirmation,
        setPasswordConfirmation,
        handleSignInSubmit,
        handleSignUpSubmit,
        toggleAuthMode,
        showToast
    };
}
