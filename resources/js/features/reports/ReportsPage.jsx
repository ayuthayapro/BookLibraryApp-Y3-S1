import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Download, 
    Printer, 
    TrendingUp, 
    CheckCircle2, 
    AlertTriangle, 
    BookOpen, 
    Layers, 
    Users, 
    Calendar,
    ArrowUpRight,
    RefreshCw
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { dashboardService } from '../../services/dashboardService';
import { copiesService } from '../../services/copiesService';
import { loansService } from '../../services/loansService';
import { booksService } from '../../services/booksService';
import { useToast } from '../../app/ToastContext';
import { formatDate } from '../../lib/utils';

export default function ReportsPage() {
    const { showToast } = useToast();

    const [stats, setStats] = useState(null);
    const [popularBooks, setPopularBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingInventory, setExportingInventory] = useState(false);
    const [exportingLoans, setExportingLoans] = useState(false);

    // Load reports data
    const loadReportData = async () => {
        try {
            setLoading(true);
            const [statsRes, popularRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getPopularBooks(),
            ]);

            setStats(statsRes);
            setPopularBooks(popularRes.popular_books || []);
        } catch (err) {
            showToast('Failed to load library analytics data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    // CSV helper: escape cell
    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    // Export Inventory CSV
    const handleExportInventoryCsv = async () => {
        try {
            setExportingInventory(true);
            const res = await booksService.getBooks({ per_page: 200 });
            const books = res.data || [];

            const headers = ['ID', 'Title', 'ISBN', 'Category', 'Published Year', 'Total Copies', 'Available Copies'];
            const rows = books.map((b) => [
                b.id,
                b.title,
                b.isbn || 'N/A',
                b.category?.name || 'General',
                b.published_year || 'N/A',
                b.copies_count ?? (b.copies ? b.copies.length : 0),
                b.available_copies_count ?? 0,
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map(escapeCsv).join(',')),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `library-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            showToast('Inventory CSV exported successfully', 'success');
        } catch (err) {
            showToast('Failed to export inventory CSV', 'error');
        } finally {
            setExportingInventory(false);
        }
    };

    // Export Loans Circulation CSV
    const handleExportLoansCsv = async () => {
        try {
            setExportingLoans(true);
            const res = await loansService.getLoans({ per_page: 200 });
            const loans = res.data || [];

            const headers = ['Loan ID', 'Borrower Name', 'Borrower Email', 'Book Title', 'Barcode', 'Borrowed Date', 'Due Date', 'Returned Date', 'Status'];
            const rows = loans.map((l) => [
                l.id,
                l.user?.name || 'Unknown',
                l.user?.email || 'N/A',
                l.book_copy?.book?.title || 'Unknown',
                l.book_copy?.barcode || 'N/A',
                l.borrowed_at,
                l.due_at,
                l.returned_at || 'Not Returned',
                l.status,
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map(escapeCsv).join(',')),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `library-circulation-loans-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            showToast('Circulation Loans CSV exported successfully', 'success');
        } catch (err) {
            showToast('Failed to export loans CSV', 'error');
        } finally {
            setExportingLoans(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const summary = stats?.summary || {};
    const breakdowns = stats?.breakdowns || {};
    const conditionCounts = breakdowns.copies_by_condition || {};
    const totalCopies = summary.total_copies || 1;

    return (
        <div className="space-y-6">
            {/* Header & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-7 h-7 text-blue-600" />
                        Audit & Circulation Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Executive summaries, compliance rates, asset condition breakdowns, and CSV data exports.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                        variant="secondary"
                        icon={Download}
                        loading={exportingInventory}
                        onClick={handleExportInventoryCsv}
                    >
                        Export Inventory CSV
                    </Button>
                    <Button
                        variant="secondary"
                        icon={Download}
                        loading={exportingLoans}
                        onClick={handleExportLoansCsv}
                    >
                        Export Circulation CSV
                    </Button>
                    <Button
                        variant="primary"
                        icon={Printer}
                        onClick={handlePrint}
                    >
                        Print Report
                    </Button>
                </div>
            </div>

            {/* Top Performance Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        On-Time Return Rate
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">
                            {summary.return_rate_percentage ?? 100}%
                        </span>
                        <Badge variant="success" size="xs">
                            Compliant
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        {summary.returned_loans ?? 0} out of {summary.total_loans ?? 0} total borrowings
                    </p>
                </Card>

                <Card className="p-5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Shelf Availability
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">
                            {summary.total_copies > 0
                                ? Math.round(((summary.available_copies || 0) / summary.total_copies) * 100)
                                : 100}%
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                            {summary.available_copies ?? 0} / {summary.total_copies ?? 0}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Available on physical library shelves
                    </p>
                </Card>

                <Card className="p-5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Overdue Exposure
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-rose-600">
                            {summary.overdue_loans ?? 0}
                        </span>
                        <Badge variant={summary.overdue_loans > 0 ? 'danger' : 'success'} size="xs">
                            {summary.overdue_loans > 0 ? 'Delinquent' : 'Clear'}
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Requires librarian follow-up
                    </p>
                </Card>

                <Card className="p-5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Active Patrons
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">
                            {summary.active_borrowers ?? 0}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                            of {summary.total_users ?? 0} users
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Currently holding active loans
                    </p>
                </Card>
            </div>

            {/* Condition Breakdown & Category Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Physical Asset Condition */}
                <Card className="p-6">
                    <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        Physical Copy Condition Audit
                    </h3>

                    <div className="space-y-4">
                        {[
                            { key: 'new', label: 'New / Mint Condition', color: 'bg-emerald-500' },
                            { key: 'good', label: 'Good Standard Condition', color: 'bg-blue-500' },
                            { key: 'fair', label: 'Fair Wear & Tear', color: 'bg-amber-500' },
                            { key: 'poor', label: 'Poor / Requires Replacement', color: 'bg-rose-500' },
                        ].map((c) => {
                            const count = conditionCounts[c.key] || 0;
                            const pct = Math.round((count / totalCopies) * 100);
                            return (
                                <div key={c.key} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>{c.label}</span>
                                        <span>{count} units ({pct}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${c.color} transition-all duration-500`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Top Categories */}
                <Card className="p-6">
                    <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        Catalog Classification Distribution
                    </h3>

                    <div className="space-y-3">
                        {breakdowns.top_categories && breakdowns.top_categories.length > 0 ? (
                            breakdowns.top_categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                                >
                                    <span className="font-bold text-slate-900 text-sm">
                                        {cat.name}
                                    </span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                                        {cat.books_count} titles
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 italic">No categories cataloged yet.</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Popular Books Ranking Table */}
            <Card className="p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Most Circulated Book Titles
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-extrabold">
                                <th className="pb-3 w-12">#</th>
                                <th className="pb-3">Book Title</th>
                                <th className="pb-3">Category</th>
                                <th className="pb-3">ISBN</th>
                                <th className="pb-3 text-right">Circulation Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {popularBooks.map((book, idx) => (
                                <tr key={book.id} className="hover:bg-slate-50/60">
                                    <td className="py-3 font-mono font-bold text-slate-400">
                                        0{idx + 1}
                                    </td>
                                    <td className="py-3">
                                        <span className="font-extrabold text-slate-900 block text-sm">
                                            {book.title}
                                        </span>
                                        <span className="text-slate-500 text-[11px]">
                                            {book.authors || 'Unknown Authors'}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <Badge variant="default" size="xs">
                                            {book.category?.name || 'General'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 font-mono text-slate-600">
                                        {book.isbn || 'N/A'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="font-black text-blue-600 text-sm">
                                            {book.loans_count ?? 0}
                                        </span>
                                        <span className="text-slate-400 ml-1">loans</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

