let memoryToken: string | null = null;

// Read token from localStorage for persistence across browser tabs and refreshes
try {
    memoryToken = localStorage.getItem('ln_token') || sessionStorage.getItem('ln_token');
} catch (e) {
    console.error("Failed to read token from web storage", e);
}

export const authClient = {
    setToken(token: string) {
        memoryToken = token;
        try {
            localStorage.setItem('ln_token', token);
            sessionStorage.setItem('ln_token', token);
        } catch (e) {
            console.error("Failed to save token to storage", e);
        }
    },
    getToken(): string | null {
        if (!memoryToken) {
            try {
                memoryToken = localStorage.getItem('ln_token') || sessionStorage.getItem('ln_token');
            } catch (e) {
                // ignore
            }
        }
        return memoryToken;
    },
    clearToken() {
        memoryToken = null;
        try {
            localStorage.removeItem('ln_token');
            sessionStorage.removeItem('ln_token');
        } catch (e) {
            console.error("Failed to remove token from storage", e);
        }
    }
};
