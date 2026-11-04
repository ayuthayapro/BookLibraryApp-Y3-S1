import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, setStoredUser, setAuthToken, isSuperAdmin, userHasRole } from '../services/api';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.getMe().then(res => {
            if (res.success && res.data?.user) {
                setUser(res.data.user);
                setStoredUser(res.data.user);
            } else if (res.status === 401) {
                logout();
            }
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });
    }, []);

    const login = async (email, password) => {
        const res = await authService.login(email, password);
        if (res.success && res.data?.user) {
            setUser(res.data.user);
        }
        return res;
    };

    const register = async (formData) => {
        const res = await authService.register(formData);
        if (res.success && res.data?.user) {
            setUser(res.data.user);
        }
        return res;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        isAdmin: isSuperAdmin(user),
        hasRole: (role) => userHasRole(user, role),
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

