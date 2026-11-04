import React from 'react';
import { 
    LayoutDashboard, 
    BookOpen, 
    FolderTree, 
    Layers, 
    Barcode, 
    ArrowLeftRight, 
    AlertTriangle, 
    Users, 
    ShieldCheck, 
    Globe, 
    Sparkles, 
    FileText, 
    ChevronLeft, 
    ChevronRight,
    Library
} from 'lucide-react';
import { useAuth } from '../../app/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, overdueCount = 0 }) {
    const { user, isAdmin } = useAuth();

    const navSections = [
        {
            title: 'OVERVIEW',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'CATALOG',
            items: [
                { id: 'books', label: 'Books Catalog', icon: BookOpen },
                { id: 'categories', label: 'Categories', icon: FolderTree },
            ],
        },
        {
            title: 'INVENTORY & BARCODES',
            items: [
                { id: 'inventory', label: 'Physical Copies & Stock', icon: Layers },
                { id: 'barcodes', label: 'Barcode Scanner & Labels', icon: Barcode },
            ],
        },
        {
            title: 'CIRCULATION DESK',
            items: [
                { id: 'borrowing', label: 'Borrowing & Returns', icon: ArrowLeftRight },
                { 
                    id: 'overdue', 
                    label: 'Overdue Books', 
                    icon: AlertTriangle, 
                    badge: overdueCount > 0 ? overdueCount : null,
                    badgeColor: 'bg-rose-500' 
                },
            ],
        },
        {
            title: 'SUPER-ADMIN & ACCESS',
            items: [
                { id: 'members', label: 'User & Member Accounts', icon: Users, adminOnly: true },
                { id: 'administrators', label: 'Roles & Permissions', icon: ShieldCheck, adminOnly: true, superBadge: 'Super' },
            ],
        },
        {
            title: 'REPORTS & SMART TOOLS',
            items: [
                { id: 'reports', label: 'Audit & Reports', icon: FileText },
                { id: 'google', label: 'Google Books Import', icon: Globe },
                { id: 'ai', label: 'Gemini AI Tools', icon: Sparkles, badge: 'AI', badgeColor: 'bg-purple-500' },
            ],
        },
    ];

    return (
        <aside 
            className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300 border-r border-slate-800 z-30 select-none ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Top Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
                <div 
                    onClick={() => setActiveTab('dashboard')} 
                    className="flex items-center gap-3 cursor-pointer overflow-hidden"
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
                        <Library className="w-5 h-5" />
                    </div>
                    {!collapsed && (
                        <div className="truncate">
                            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                                BookLibrary
                            </span>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                Admin Portal
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors hidden md:block"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation Menus */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
                {navSections.map((section, sIdx) => {
                    const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={sIdx} className="space-y-1">
                            {!collapsed && (
                                <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                                    {section.title}
                                </p>
                            )}

                            {visibleItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        title={collapsed ? item.label : undefined}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                        
                                        {!collapsed && (
                                            <>
                                                <span className="truncate flex-1 text-left">{item.label}</span>
                                                {item.badge && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white shrink-0 ${item.badgeColor || 'bg-slate-700'}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {item.superBadge && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wide">
                                                        {item.superBadge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* User Profile Pill at Bottom */}
            {user && (
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div className="truncate flex-1">
                                <span className="text-xs font-bold text-white block truncate leading-tight">
                                    {user.name}
                                </span>
                                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                                    {user.roles?.[0]?.display_name || user.roles?.[0]?.name || (isAdmin ? 'Admin' : 'Staff')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}

