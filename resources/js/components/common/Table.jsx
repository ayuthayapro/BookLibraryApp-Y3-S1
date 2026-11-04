import React from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export default function Table({ 
    headers = [], 
    children, 
    loading = false, 
    emptyMessage = 'No records found.', 
    emptyIcon: EmptyIcon,
    className = '' 
}) {
    return (
        <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase font-semibold text-slate-500">
                            {headers.map((h, idx) => (
                                <th key={idx} className={cn('py-3 px-4', h.className)}>
                                    {h.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={headers.length || 1} className="py-16 text-center text-slate-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                                        <span>Loading records...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : !children || React.Children.count(children) === 0 ? (
                            <tr>
                                <td colSpan={headers.length || 1} className="py-16 text-center text-slate-400">
                                    {EmptyIcon && <EmptyIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />}
                                    <p className="font-medium">{emptyMessage}</p>
                                </td>
                            </tr>
                        ) : (
                            children
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

