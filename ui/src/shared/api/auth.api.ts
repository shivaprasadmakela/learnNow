import { supabase } from '../supabaseClient';

export const getCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};
