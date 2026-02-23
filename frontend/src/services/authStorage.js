const TOKEN_KEY = "auth_token";
const EXP_KEY = "auth_expiration";
const USER_KEY = "auth_user";

export function saveSession(token, expiresInSeconds, user) {
    const expiration = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXP_KEY, String(expiration));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
}

export function isTokenExpired() {
    const exp = localStorage.getItem(EXP_KEY);
    if (!exp) return true;
    return Date.now() > Number(exp);
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    localStorage.removeItem(USER_KEY);
}
