let memoryToken: string | null = null;

// Fallback to sessionStorage for persistence across page refreshes
try {
    memoryToken = sessionStorage.getItem('ln_token');
} catch (e) {
    console.error("Failed to read token from sessionStorage", e);
}

export const authClient = {
    setToken(token: string) {
        memoryToken = token;
        try {
            sessionStorage.setItem('ln_token', token);
        } catch (e) {
            console.error("Failed to save token to sessionStorage", e);
        }
    },
    getToken(): string | null {
        return memoryToken;
    },
    clearToken() {
        memoryToken = null;
        try {
            sessionStorage.removeItem('ln_token');
        } catch (e) {
            console.error("Failed to remove token from sessionStorage", e);
        }
    }
};
