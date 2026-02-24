const TOKEN_KEY = "auth_token";
const EXP_KEY = "auth_expiration";
const USER_KEY = "auth_user";

export type UserProfile = {
    name: string;
    email: string;
    avatarBase64?: string | null;
};

export function saveSession(token: string, expiresInSeconds: number, user: UserProfile) {
    const expiration = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXP_KEY, String(expiration));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): UserProfile | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data) as UserProfile;
    } catch {
        return null;
    }
}

export function setUser(user: UserProfile) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isTokenExpired(): boolean {
    const exp = localStorage.getItem(EXP_KEY);
    if (!exp) return true;
    return Date.now() > Number(exp);
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    localStorage.removeItem(USER_KEY);
}
