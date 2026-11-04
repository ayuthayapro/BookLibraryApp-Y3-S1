import React from 'react';
import { useAuth } from '../app/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/common/Button';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
                <span>Checking authentication credentials...</span>
            </div>
        );
    }

    if (!user) {
        return null; // Will trigger login view in AppRoutes
    }

    if (adminOnly && !isAdmin) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-md mx-auto my-12 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Super-Admin Access Required</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                    This section is restricted to Administrator accounts. Your current profile has staff / member permissions.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Refresh Session
                </Button>
            </div>
        );
    }

    return children;
}

