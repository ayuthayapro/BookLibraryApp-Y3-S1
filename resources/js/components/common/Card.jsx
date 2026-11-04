import React from 'react';
import { cn } from '../../lib/utils';

export default function Card({ children, className = '', ...props }) {
    return (
        <div 
            className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5', className)} 
            {...props}
        >
            {children}
        </div>
    );
}

