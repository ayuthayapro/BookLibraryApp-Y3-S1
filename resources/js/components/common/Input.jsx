import React from 'react';
import { cn } from '../../lib/utils';

export default function Input({ label, error, icon: Icon, className = '', ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                    className={cn(
                        'w-full py-2 text-xs bg-slate-50 border rounded-xl transition-colors focus:outline-hidden focus:bg-white',
                        Icon ? 'pl-10 pr-3.5' : 'px-3.5',
                        error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>
            )}
        </div>
    );
}

