import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import BooksPage from '../features/books/BooksPage';
import CategoriesPage from '../features/categories/CategoriesPage';
import InventoryPage from '../features/inventory/InventoryPage';
import BarcodesPage from '../features/inventory/BarcodesPage';
import BorrowingPage from '../features/borrowing/BorrowingPage';
import MembersPage from '../features/members/MembersPage';
import AdministratorsPage from '../features/administrators/AdministratorsPage';
import ReportsPage from '../features/reports/ReportsPage';
import GoogleBooksPage from '../features/integrations/GoogleBooksPage';
import GeminiAiPage from '../features/integrations/GeminiAiPage';
import { loansService } from '../services/loansService';

export default function AppRoutes() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [overdueCount, setOverdueCount] = useState(0);

    // Cross-page payload state
    const [scannedCopyForLoan, setScannedCopyForLoan] = useState(null);
    const [bookForSummary, setBookForSummary] = useState(null);
    const [quickAddBookTrigger, setQuickAddBookTrigger] = useState(false);

    // Fetch overdue count for badge indicator
    useEffect(() => {
        if (user) {
            loansService.getOverdueLoans({ per_page: 1 }).then((res) => {
                setOverdueCount(res.total || 0);
            }).catch(() => {});
        }
    }, [user, activeTab]);

    // Loading screen while checking initial session token
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-blue-500/30">
                    <span className="text-xl font-black">B</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    <span>Connecting to Library Portal...</span>
                </div>
            </div>
        );
    }

    // Unauthenticated: render Login Page inside AuthLayout
    if (!user) {
        return (
            <AuthLayout>
                <LoginPage />
            </AuthLayout>
        );
    }

    // Navigation callbacks
    const handleQuickAddBook = () => {
        setActiveTab('books');
        setQuickAddBookTrigger(true);
    };

    const handleQuickScanBarcode = () => {
        setActiveTab('barcodes');
    };

    const handleNavigateToLoanWithCopy = (copy) => {
        setScannedCopyForLoan(copy);
        setActiveTab('borrowing');
    };

    const handleSummarizeBook = (book) => {
        setBookForSummary(book);
        setActiveTab('ai');
    };

    // Render active tab view
    const renderActiveContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <DashboardPage
                        onNavigate={(tab) => setActiveTab(tab)}
                        onQuickAddBook={handleQuickAddBook}
                        onQuickScan={handleQuickScanBarcode}
                    />
                );

            case 'books':
                return (
                    <BooksPage
                        initialAddOpen={quickAddBookTrigger}
                        onAddModalClosed={() => setQuickAddBookTrigger(false)}
                        onSummarizeBook={handleSummarizeBook}
                    />
                );

            case 'categories':
                return <CategoriesPage />;

            case 'inventory':
                return (
                    <InventoryPage
                        onNavigateToScanner={() => setActiveTab('barcodes')}
                    />
                );

            case 'barcodes':
                return (
                    <BarcodesPage
                        onNavigateToLoan={handleNavigateToLoanWithCopy}
                    />
                );

            case 'borrowing':
                return (
                    <BorrowingPage
                        isOverdueOnly={false}
                        initialCopy={scannedCopyForLoan}
                    />
                );

            case 'overdue':
                return (
                    <BorrowingPage
                        isOverdueOnly={true}
                    />
                );

            case 'members':
                return <MembersPage />;

            case 'administrators':
                return <AdministratorsPage />;

            case 'reports':
                return <ReportsPage />;

            case 'google':
                return (
                    <GoogleBooksPage
                        onImportSuccess={() => setActiveTab('books')}
                    />
                );

            case 'ai':
                return (
                    <GeminiAiPage
                        initialBookForSummary={bookForSummary}
                    />
                );

            default:
                return (
                    <DashboardPage
                        onNavigate={(tab) => setActiveTab(tab)}
                        onQuickAddBook={handleQuickAddBook}
                        onQuickScan={handleQuickScanBarcode}
                    />
                );
        }
    };

    return (
        <AdminLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onQuickAddBook={handleQuickAddBook}
            onQuickScanBarcode={handleQuickScanBarcode}
            overdueCount={overdueCount}
        >
            {renderActiveContent()}
        </AdminLayout>
    );
}

