import React from 'react';
import { AuthProvider } from './app/AuthContext';
import { ToastProvider } from './app/ToastContext';
import ToastContainer from './components/common/ToastContainer';
import AppRoutes from './routes/AppRoutes';

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppRoutes />
                <ToastContainer />
            </ToastProvider>
        </AuthProvider>
    );
}
