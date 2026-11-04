import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onRemove }) {
    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => {
                const isSuccess = toast.type === 'success';
                const isError = toast.type === 'error';

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
                            isSuccess
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : isError
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                            {isError && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                            {!isSuccess && !isError && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                            <span>{toast.message}</span>
                        </div>

                        <button
                            onClick={() => onRemove(toast.id)}
                            className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

