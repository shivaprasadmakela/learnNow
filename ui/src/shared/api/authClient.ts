/**
 * Token storage.
 *
 * Tokens are held in memory and mirrored to sessionStorage so a page reload keeps the
 * session, while closing the tab ends it. The previous version wrote the same value to
 * BOTH localStorage and sessionStorage, which doubled the surface an XSS could read
 * from for no benefit - the two stores exist to express different lifetimes.
 *
 * A refresh token in browser storage is still readable by injected script. The stronger
 * design is an HttpOnly cookie set by the backend; that requires re-enabling CSRF
 * protection and is tracked separately. Access tokens are now short-lived, which bounds
 * the damage in the meantime.
 */
const ACCESS_KEY = 'ln_token';
const REFRESH_KEY = 'ln_refresh';

let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

const read = (key: string): string | null => {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
};

const write = (key: string, value: string) => {
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        console.error('Could not persist session', e);
    }
};

const remove = (key: string) => {
    try {
        sessionStorage.removeItem(key);
        // Clear the legacy localStorage entry so old sessions do not linger.
        localStorage.removeItem(key);
    } catch {
        /* storage unavailable - in-memory state is still cleared */
    }
};

memoryToken = read(ACCESS_KEY);
memoryRefreshToken = read(REFRESH_KEY);

/** Subscribers notified when the session ends, so the UI can route to sign-in. */
const sessionEndedListeners = new Set<() => void>();

export const authClient = {
    setSession(token: string, refreshToken?: string) {
        memoryToken = token;
        write(ACCESS_KEY, token);
        if (refreshToken) {
            memoryRefreshToken = refreshToken;
            write(REFRESH_KEY, refreshToken);
        }
    },

    /** @deprecated use setSession; kept so older call sites keep compiling */
    setToken(token: string) {
        this.setSession(token);
    },

    getToken(): string | null {
        if (!memoryToken) {
            memoryToken = read(ACCESS_KEY);
        }
        return memoryToken;
    },

    getRefreshToken(): string | null {
        if (!memoryRefreshToken) {
            memoryRefreshToken = read(REFRESH_KEY);
        }
        return memoryRefreshToken;
    },

    clearToken() {
        memoryToken = null;
        memoryRefreshToken = null;
        remove(ACCESS_KEY);
        remove(REFRESH_KEY);
    },

    onSessionEnded(listener: () => void): () => void {
        sessionEndedListeners.add(listener);
        return () => sessionEndedListeners.delete(listener);
    },

    notifySessionEnded() {
        this.clearToken();
        sessionEndedListeners.forEach((listener) => {
            try {
                listener();
            } catch (e) {
                console.error('Session-ended listener failed', e);
            }
        });
    }
};
