import React from 'react';
import { cn } from '../../lib/utils';

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-700 border-slate-200',
        primary: 'bg-blue-50 text-blue-700 border-blue-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const sizes = {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
    };

    return (
        <span className={cn(
            'inline-flex items-center font-bold rounded-full border',
            variants[variant] || variants.default,
            sizes[size] || sizes.sm,
            className
        )}>
            {children}
        </span>
    );
}

