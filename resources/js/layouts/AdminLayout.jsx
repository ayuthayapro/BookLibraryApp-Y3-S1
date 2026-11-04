import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function AdminLayout({ 
    activeTab, 
    setActiveTab, 
    onQuickAddBook, 
    onQuickScanBarcode, 
    overdueCount,
    children 
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    overdueCount={overdueCount}
                />
            </div>

            {/* Mobile Drawer Sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative z-10 w-64">
                        <Sidebar
                            activeTab={activeTab}
                            setActiveTab={(tab) => { setActiveTab(tab); setMobileOpen(false); }}
                            collapsed={false}
                            setCollapsed={() => {}}
                            overdueCount={overdueCount}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    activeTab={activeTab}
                    onQuickAddBook={onQuickAddBook}
                    onQuickScanBarcode={onQuickScanBarcode}
                    onToggleMobileSidebar={() => setMobileOpen(true)}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

