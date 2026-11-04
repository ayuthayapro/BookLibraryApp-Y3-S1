import React from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export default function Table({ 
    headers,
    columns,
    data,
    keyExtractor,
    children, 
    loading = false, 
    emptyMessage = 'No records found.', 
    emptyIcon: EmptyIcon,
    className = '' 
}) {
    // Normalize headers: support both `columns` prop and `headers` prop
    let tableHeaders = [];
    if (Array.isArray(columns) && columns.length > 0) {
        tableHeaders = columns.map(col => ({
            label: col.header || col.label || '',
            className: cn(
                col.align === 'right' ? 'text-right' : (col.align === 'center' ? 'text-center' : 'text-left'),
                col.className
            )
        }));
    } else if (Array.isArray(headers) && headers.length > 0) {
        tableHeaders = headers.map(h => typeof h === 'string' ? { label: h } : h);
    }

    const safeData = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

    return (
        <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    {tableHeaders.length > 0 && (
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase font-semibold text-slate-500">
                                {tableHeaders.map((h, idx) => (
                                    <th key={idx} className={cn('py-3 px-4', h.className)}>
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={tableHeaders.length || 1} className="py-16 text-center text-slate-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                                        <span>Loading records...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : columns && safeData.length === 0 ? (
                            <tr>
                                <td colSpan={tableHeaders.length || 1} className="py-16 text-center text-slate-400">
                                    {EmptyIcon && <EmptyIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />}
                                    <p className="font-medium">{emptyMessage}</p>
                                </td>
                            </tr>
                        ) : columns && safeData.length > 0 ? (
                            safeData.map((item, rowIdx) => {
                                const key = keyExtractor ? keyExtractor(item) : (item.id ?? rowIdx);
                                return (
                                    <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                                        {columns.map((col, colIdx) => (
                                            <td 
                                                key={colIdx} 
                                                className={cn(
                                                    'py-3 px-4 align-middle',
                                                    col.align === 'right' ? 'text-right' : (col.align === 'center' ? 'text-center' : 'text-left'),
                                                    col.cellClassName
                                                )}
                                            >
                                                {col.render ? col.render(item, rowIdx) : (item[col.accessor] ?? null)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : !children || React.Children.count(children) === 0 ? (
                            <tr>
                                <td colSpan={tableHeaders.length || 1} className="py-16 text-center text-slate-400">
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
