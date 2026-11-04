import React, { useState } from 'react';
import { 
    Search, 
    Plus, 
    LogOut, 
    User, 
    Shield, 
    Menu, 
    Barcode,
    BookOpen
} from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { useAuth } from '../../app/AuthContext';

export default function Header({ 
    activeTab, 
    onQuickAddBook, 
    onQuickScanBarcode,
    onToggleMobileSidebar
}) {
    const { user, isAdmin, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const tabTitles = {
        dashboard: 'Analytics & Dashboard',
        books: 'Books Catalog Management',
        categories: 'Categories & Classification',
        inventory: 'Physical Copies & Stock',
        barcodes: 'Barcode Scanner & Labels',
        borrowing: 'Borrowing & Circulation Desk',
        overdue: 'Overdue Books Tracking',
        members: 'User & Member Accounts',
        administrators: 'Super-Admin Roles & Permissions',
        google: 'Google Books Online Sync',
        ai: 'Gemini AI Assistant & Tools',
        reports: 'Circulation & Inventory Reports',
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
            {/* Left side: Mobile toggle & Breadcrumb */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleMobileSidebar}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div>
                    <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                        {tabTitles[activeTab] || 'Library Administration'}
                    </h1>
                    <Breadcrumb items={[activeTab]} />
                </div>
            </div>

            {/* Right side: Quick Actions & User Dropdown */}
            <div className="flex items-center gap-3">
                {/* Live backend status badge */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>API v1 Connected</span>
                </div>

                {/* Quick actions */}
                <button
                    onClick={onQuickScanBarcode}
                    title="Quick scan barcode"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                    <Barcode className="w-3.5 h-3.5 text-slate-500" />
                    <span>Scan</span>
                </button>

                <button
                    onClick={onQuickAddBook}
                    title="Add new book title"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Book</span>
                </button>

                {/* User Dropdown */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {isAdmin ? 'Super Admin' : 'Staff'}
                                </span>
                            </div>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-2 border-b border-slate-100">
                                    <p className="font-bold text-slate-900">{user.name}</p>
                                    <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                                        {isAdmin ? 'Administrator' : 'Librarian'}
                                    </span>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => { setDropdownOpen(false); logout(); }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

