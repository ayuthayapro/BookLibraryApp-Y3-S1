import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
    return (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-slate-500">
                <Home className="w-3.5 h-3.5" />
                <span>Admin</span>
            </span>

            {items.map((item, idx) => (
                <React.Fragment key={idx}>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className={idx === items.length - 1 ? 'text-blue-600 font-bold capitalize' : 'text-slate-500 capitalize'}>
                        {item}
                    </span>
                </React.Fragment>
            ))}
        </nav>
    );
}

