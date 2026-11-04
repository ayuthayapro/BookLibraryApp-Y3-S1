/**
 * Central API Client for Laravel V1 Backend
 */

const BASE_URL = '/api/v1';

export function getAuthToken() {
    return localStorage.getItem('library_admin_token');
}

export function setAuthToken(token) {
    if (token) {
        localStorage.setItem('library_admin_token', token);
    } else {
        localStorage.removeItem('library_admin_token');
    }
}

export function getStoredUser() {
    const raw = localStorage.getItem('library_admin_user');
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    if (user) {
        localStorage.setItem('library_admin_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('library_admin_user');
    }
}

export function userHasRole(user, roleName) {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.name === roleName || r === roleName);
}

export function isSuperAdmin(user) {
    return userHasRole(user, 'admin');
}

export async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 204) {
            return { success: true, data: null, status: 204 };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                status: response.status,
                error: data.message || 'An error occurred with this request.',
                errors: data.errors || null,
            };
        }

        return {
            success: true,
            data,
            status: response.status,
        };
    } catch (err) {
        return {
            success: false,
            status: 0,
            error: err.message || 'Network connection failed.',
        };
    }
}

