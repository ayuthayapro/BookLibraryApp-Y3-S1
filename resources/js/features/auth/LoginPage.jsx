import React, { useState } from 'react';
import { Library, Mail, Lock, User, ArrowRight, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function LoginPage() {
    const { login, register } = useAuth();
    const { showToast } = useToast();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const res = isRegister
            ? await register({ name, email, password, password_confirmation: passwordConfirmation })
            : await login(email, password);

        setLoading(false);

        if (!res.success) {
            setError(res.error || 'Authentication failed. Please verify credentials.');
            return;
        }

        showToast(isRegister ? 'Account registered successfully!' : 'Welcome back to BookLibrary!');
    };

    const handlePresetLogin = async (presetEmail, presetPass) => {
        setError(null);
        setLoading(true);
        const res = await login(presetEmail, presetPass);
        setLoading(false);

        if (!res.success) {
            setError(res.error || 'Could not log in with preset account.');
            return;
        }

        showToast('Logged in successfully!');
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/20">
            {/* Branding Top */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 p-8 text-center text-white relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
                    <Library className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">BookLibrary Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Practicum Library Administration System</p>
            </div>

            {/* Form & Actions */}
            <div className="p-8">
                {/* 1-Click Demo Login */}
                {!isRegister && (
                    <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                            <span>1-Click Quick Demo Login</span>
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handlePresetLogin('test@example.com', 'password')}
                                className="px-3 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Super Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetLogin('librarian@example.com', 'password')}
                                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>Librarian</span>
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <Input
                            label="Full Name"
                            icon={User}
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                        />
                    )}

                    <Input
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                    />

                    <Input
                        label="Password"
                        icon={Lock}
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    {isRegister && (
                        <Input
                            label="Confirm Password"
                            icon={Lock}
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="••••••••"
                        />
                    )}

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full py-3 mt-2 font-bold"
                    >
                        <span>{isRegister ? 'Register Admin Account' : 'Sign In to Dashboard'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    {isRegister ? (
                        <span>
                            Already have an account?{' '}
                            <button
                                onClick={() => { setIsRegister(false); setError(null); }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Log in
                            </button>
                        </span>
                    ) : (
                        <span>
                            Need an account?{' '}
                            <button
                                onClick={() => { setIsRegister(true); setError(null); }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Register
                            </button>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

