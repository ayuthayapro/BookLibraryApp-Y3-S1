import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Layers, 
    ArrowLeftRight, 
    AlertTriangle, 
    CheckCircle, 
    TrendingUp, 
    Clock, 
    BarChart3,
    RefreshCw,
    Plus,
    Barcode,
    Sparkles
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function DashboardPage({ onNavigateTab }) {
    const [stats, setStats] = useState(null);
    const [popularBooks, setPopularBooks] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const [statsRes, popRes, actRes, chartRes] = await Promise.all([
            dashboardService.getStats(),
            dashboardService.getPopularBooks(),
            dashboardService.getRecentActivities(),
            dashboardService.getCharts(),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (popRes.success) setPopularBooks(popRes.data?.popular_books || []);
        if (actRes.success) setRecentActivities(actRes.data?.recent_activities || []);
        if (chartRes.success) setCharts(chartRes.data?.daily_circulation_trend || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const summary = stats?.summary || {};

    const kpiCards = [
        {
            label: 'Total Catalog Titles',
            value: summary.total_books ?? 0,
            icon: BookOpen,
            color: 'from-blue-500 to-indigo-600',
            sub: `${summary.total_copies ?? 0} total physical copies`,
            actionTab: 'books',
        },
        {
            label: 'Available on Shelf',
            value: summary.available_copies ?? 0,
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-600',
            sub: `${Math.round(((summary.available_copies || 0) / (summary.total_copies || 1)) * 100)}% inventory available`,
            actionTab: 'inventory',
        },
        {
            label: 'Active Loans',
            value: summary.active_loans ?? 0,
            icon: ArrowLeftRight,
            color: 'from-amber-500 to-orange-600',
            sub: `${summary.active_borrowers ?? 0} registered active borrowers`,
            actionTab: 'borrowing',
        },
        {
            label: 'Overdue Books',
            value: summary.overdue_loans ?? 0,
            icon: AlertTriangle,
            color: 'from-rose-500 to-red-600',
            sub: `${summary.return_rate_percentage ?? 100}% overall return rate`,
            actionTab: 'overdue',
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Quick Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time overview of catalog size, circulation health, and library metrics</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        icon={RefreshCw} 
                        loading={loading}
                        onClick={loadData}
                    >
                        Refresh Data
                    </Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        icon={Plus}
                        onClick={() => onNavigateTab('books')}
                    >
                        New Book
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onNavigateTab(kpi.actionTab)}
                            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition-colors">
                                        {kpi.label}
                                    </p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${kpi.color} text-white flex items-center justify-center shadow-md shadow-slate-200 group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                                <span>{kpi.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Grid: Popular Books & 14-Day Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Books */}
                <Card className="lg:col-span-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <h4 className="font-bold text-slate-900 text-sm">Most Borrowed Titles</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Ranking</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {popularBooks.length === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center">No borrowing data recorded yet.</p>
                            ) : (
                                popularBooks.slice(0, 5).map((book, idx) => (
                                    <div key={book.id} className="py-2.5 flex items-center justify-between gap-3 group">
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span className="w-5 text-center font-bold text-xs text-slate-400 group-hover:text-blue-600">
                                                #{idx + 1}
                                            </span>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {book.title}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{book.authors || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <Badge variant="primary" size="xs">
                                            {book.loans_count} loans
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-right">
                        <button
                            onClick={() => onNavigateTab('books')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            View All Catalog Titles &rarr;
                        </button>
                    </div>
                </Card>

                {/* 14-Day Circulation Trend */}
                <Card className="lg:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-slate-900 text-sm">14-Day Circulation Activity</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-blue-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Borrowed
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Returned
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end gap-2 pt-6 pb-2 min-h-[160px]">
                        {charts.map((day, idx) => {
                            const maxVal = Math.max(...charts.map(c => Math.max(c.borrowed, c.returned, 1)), 5);
                            const bH = Math.max((day.borrowed / maxVal) * 120, 4);
                            const rH = Math.max((day.returned / maxVal) * 120, 4);
                            const dateLabel = day.date ? day.date.slice(5) : '';

                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full flex items-end justify-center gap-1 h-32">
                                        <div 
                                            style={{ height: `${bH}px` }}
                                            title={`Borrowed: ${day.borrowed}`}
                                            className="w-2.5 sm:w-3.5 bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-all"
                                        />
                                        <div 
                                            style={{ height: `${rH}px` }}
                                            title={`Returned: ${day.returned}`}
                                            className="w-2.5 sm:w-3.5 bg-emerald-400 rounded-t-sm group-hover:bg-emerald-500 transition-all"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 truncate w-full text-center">
                                        {dateLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Daily circulation records over past 2 weeks</span>
                        <button
                            onClick={() => onNavigateTab('reports')}
                            className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Open Detailed Audit Report &rarr;
                        </button>
                    </div>
                </Card>
            </div>

            {/* Bottom: Recent Activity Log */}
            <Card>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        <h4 className="font-bold text-slate-900 text-sm">Recent Circulation Transactions</h4>
                    </div>
                    <button 
                        onClick={loadData}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-semibold text-slate-400">
                                <th className="py-2 px-3">Transaction</th>
                                <th className="py-2 px-3">Borrower</th>
                                <th className="py-2 px-3">Book Title</th>
                                <th className="py-2 px-3">Barcode</th>
                                <th className="py-2 px-3">Borrowed On</th>
                                <th className="py-2 px-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {recentActivities.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-6 text-center text-xs text-slate-400">
                                        No recent transactions.
                                    </td>
                                </tr>
                            ) : (
                                recentActivities.map((act) => (
                                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-slate-900">#{act.id}</td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-medium text-slate-800 block">{act.user || 'Unknown'}</span>
                                            <span className="text-[10px] text-slate-400">{act.user_email}</span>
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-900">{act.book_title || 'N/A'}</td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{act.barcode || 'N/A'}</td>
                                        <td className="py-2.5 px-3 text-slate-500">{act.borrowed_at}</td>
                                        <td className="py-2.5 px-3">
                                            <Badge variant={act.status === 'returned' ? 'success' : act.status === 'overdue' ? 'danger' : 'primary'}>
                                                {act.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

