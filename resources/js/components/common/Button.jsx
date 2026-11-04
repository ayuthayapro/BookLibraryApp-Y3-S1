import React from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export default function Button({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    icon: Icon, 
    className = '', 
    ...props 
}) {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 disabled:opacity-50',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-500/20 disabled:opacity-50',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20 disabled:opacity-50',
        ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
    };

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs rounded-lg',
        md: 'px-3.5 py-2 text-xs font-semibold rounded-xl',
        lg: 'px-4 py-2.5 text-sm font-semibold rounded-xl',
    };

    return (
        <button
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium transition-all select-none',
                variants[variant] || variants.primary,
                sizes[size] || sizes.md,
                className
            )}
            {...props}
        >
            {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : Icon ? (
                <Icon className="w-3.5 h-3.5 shrink-0" />
            ) : null}
            <span>{children}</span>
        </button>
    );
}

