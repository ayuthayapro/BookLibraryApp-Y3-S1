import { request, setAuthToken, setStoredUser } from './api';

export const authService = {
    async login(email, password) {
        const res = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (res.success && res.data) {
            const token = res.data.token || res.data.access_token || '';
            setAuthToken(token);
            setStoredUser(res.data.user);
            return {
                success: true,
                data: { token, user: res.data.user },
            };
        }
        return res;
    },

    async register(data) {
        const res = await request('/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (res.success && res.data) {
            const token = res.data.token || res.data.access_token || '';
            setAuthToken(token);
            setStoredUser(res.data.user);
            return {
                success: true,
                data: { token, user: res.data.user },
            };
        }
        return res;
    },

    async getMe() {
        return request('/me');
    },

    async logout() {
        const res = await request('/logout', { method: 'POST' });
        setAuthToken(null);
        setStoredUser(null);
        return res;
    },
};

