import React, { useState, useEffect, useCallback } from 'react';
import { 
    ArrowLeftRight, 
    Plus, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Calendar, 
    User, 
    BookOpen, 
    Barcode, 
    RefreshCw,
    Filter
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import { loansService } from '../../services/loansService';
import { copiesService } from '../../services/copiesService';
import { membersService } from '../../services/membersService';
import { useToast } from '../../app/ToastContext';
import { formatDate } from '../../lib/utils';

export default function BorrowingPage({ isOverdueOnly = false, initialCopy = null }) {
    const { showToast } = useToast();

    // Data states
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Filter states
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(isOverdueOnly ? 'overdue' : '');

    // Modal states
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Dropdown lookups
    const [availableCopies, setAvailableCopies] = useState([]);
    const [membersList, setMembersList] = useState([]);

    // Forms
    const [issueForm, setIssueForm] = useState({
        book_copy_id: initialCopy ? initialCopy.id : '',
        user_id: '',
        borrowed_at: new Date().toISOString().slice(0, 10),
        due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });

    const [returnForm, setReturnForm] = useState({
        returned_at: new Date().toISOString().slice(0, 10),
        condition: 'good',
    });

    // Update if initialCopy passed
    useEffect(() => {
        if (initialCopy) {
            setIssueForm((prev) => ({
                ...prev,
                book_copy_id: initialCopy.id,
            }));
            setIsIssueModalOpen(true);
        }
    }, [initialCopy]);

    // Update if isOverdueOnly prop changes
    useEffect(() => {
        if (isOverdueOnly) {
            setStatusFilter('overdue');
        }
    }, [isOverdueOnly]);

    // Fetch loans
    const fetchLoans = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, per_page: 15 };
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;

            let res;
            if (statusFilter === 'overdue' || isOverdueOnly) {
                res = await loansService.getOverdueLoans(params);
            } else {
                res = await loansService.getLoans(params);
            }

            setLoans(res.data || []);
            setPagination({
                current_page: res.current_page || 1,
                last_page: res.last_page || 1,
                total: res.total || 0,
            });
        } catch (err) {
            showToast(err.message || 'Failed to fetch loans', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, isOverdueOnly, showToast]);

    // Fetch available copies and members for modal
    const loadModalLookups = async () => {
        try {
            const [copiesRes, membersRes] = await Promise.all([
                copiesService.getCopies({ status: 'available', per_page: 50 }),
                membersService.getMembers({ status: 'active', per_page: 100 }),
            ]);
            setAvailableCopies(copiesRes.data || []);
            setMembersList(membersRes.data || []);
        } catch (err) {
            console.error('Failed to load lookup data', err);
        }
    };

    useEffect(() => {
        fetchLoans(1);
    }, [fetchLoans]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLoans(1);
    };

    const openIssueModal = () => {
        loadModalLookups();
        setIsIssueModalOpen(true);
    };

    // Calculate preset due dates
    const setPresetDays = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setIssueForm((prev) => ({
            ...prev,
            due_at: d.toISOString().slice(0, 10),
        }));
    };

    // Submit Issue Loan
    const handleIssueLoan = async (e) => {
        e.preventDefault();
        if (!issueForm.book_copy_id) {
            showToast('Please select a book copy', 'error');
            return;
        }
        if (!issueForm.user_id) {
            showToast('Please select a member', 'error');
            return;
        }

        try {
            setActionLoading(true);
            await loansService.borrow({
                book_copy_id: parseInt(issueForm.book_copy_id, 10),
                user_id: parseInt(issueForm.user_id, 10),
                borrowed_at: issueForm.borrowed_at,
                due_at: issueForm.due_at,
            });

            showToast('Book successfully issued to member', 'success');
            setIsIssueModalOpen(false);
            setIssueForm({
                book_copy_id: '',
                user_id: '',
                borrowed_at: new Date().toISOString().slice(0, 10),
                due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            });
            fetchLoans(1);
        } catch (err) {
            showToast(err.message || 'Failed to issue loan', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Open Return Modal
    const openReturnModal = (loan) => {
        setSelectedLoan(loan);
        setReturnForm({
            returned_at: new Date().toISOString().slice(0, 10),
            condition: loan.book_copy?.condition || 'good',
        });
        setIsReturnModalOpen(true);
    };

    // Submit Return
    const handleReturnLoan = async (e) => {
        e.preventDefault();
        if (!selectedLoan) return;

        try {
            setActionLoading(true);
            await loansService.returnLoan(selectedLoan.id, returnForm.returned_at);
            showToast('Book returned to library inventory successfully', 'success');
            setIsReturnModalOpen(false);
            setSelectedLoan(null);
            fetchLoans(pagination.current_page);
        } catch (err) {
            showToast(err.message || 'Failed to process return', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Helper: Days remaining or overdue
    const getDueStatus = (loan) => {
        if (loan.returned_at) {
            return { label: 'Returned', variant: 'success', daysText: `on ${formatDate(loan.returned_at)}` };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(loan.due_at);
        due.setHours(0, 0, 0, 0);

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: 'Overdue',
                variant: 'danger',
                daysText: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} late`,
                isOverdue: true,
            };
        } else if (diffDays === 0) {
            return { label: 'Due Today', variant: 'warning', daysText: 'Due today' };
        } else {
            return { label: 'Active', variant: 'info', daysText: `${diffDays} day${diffDays === 1 ? '' : 's'} left` };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {isOverdueOnly ? (
                            <>
                                <AlertTriangle className="w-7 h-7 text-rose-600" />
                                Overdue Books & Delinquent Loans
                            </>
                        ) : (
                            <>
                                <ArrowLeftRight className="w-7 h-7 text-blue-600" />
                                Borrowing & Circulation Desk
                            </>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isOverdueOnly
                            ? 'Monitor past-due loans, borrower contact details, and follow-up actions.'
                            : 'Issue book loans to members, track active checkouts, and process returns.'}
                    </p>
                </div>
                {!isOverdueOnly && (
                    <Button variant="primary" icon={Plus} onClick={openIssueModal}>
                        Issue New Loan
                    </Button>
                )}
            </div>

            {/* Filter Card */}
            <Card className="p-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by borrower name, email, or book title..."
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Loan Status
                        </label>
                        <select
                            disabled={isOverdueOnly}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">All Loans</option>
                            <option value="borrowed">Active Loans</option>
                            <option value="overdue">Overdue Loans</option>
                            <option value="returned">Returned Loans</option>
                        </select>
                    </div>
                </form>
            </Card>

            {/* Loans Table */}
            <Card className="overflow-hidden">
                <Table
                    columns={[
                        {
                            header: 'Loan #',
                            render: (loan) => (
                                <span className="font-mono font-bold text-slate-700 text-xs">
                                    #{loan.id}
                                </span>
                            ),
                        },
                        {
                            header: 'Borrower',
                            render: (loan) => (
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                        {loan.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 block text-xs">
                                            {loan.user?.name || 'Unknown User'}
                                        </span>
                                        <span className="text-[11px] text-slate-500 block">
                                            {loan.user?.email || 'No email'}
                                        </span>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: 'Book Copy & Barcode',
                            render: (loan) => (
                                <div>
                                    <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">
                                        {loan.book_copy?.book?.title || 'Unknown Title'}
                                    </span>
                                    <span className="font-mono text-[11px] text-blue-600 font-semibold">
                                        {loan.book_copy?.barcode || 'No barcode'}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            header: 'Borrowed Date',
                            render: (loan) => (
                                <span className="text-xs text-slate-600">
                                    {formatDate(loan.borrowed_at)}
                                </span>
                            ),
                        },
                        {
                            header: 'Due Date & Status',
                            render: (loan) => {
                                const status = getDueStatus(loan);
                                return (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant={status.variant} size="xs" dot>
                                                {status.label}
                                            </Badge>
                                            <span className="text-[11px] font-semibold text-slate-500">
                                                {status.daysText}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 block font-mono">
                                            Due: {formatDate(loan.due_at)}
                                        </span>
                                    </div>
                                );
                            },
                        },
                        {
                            header: 'Actions',
                            align: 'right',
                            render: (loan) => (
                                <div className="flex items-center justify-end">
                                    {!loan.returned_at ? (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            icon={CheckCircle2}
                                            onClick={() => openReturnModal(loan)}
                                        >
                                            Return
                                        </Button>
                                    ) : (
                                        <Badge variant="default" size="xs">
                                            Completed
                                        </Badge>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                    data={loans}
                    keyExtractor={(loan) => loan.id}
                    loading={loading}
                    emptyMessage={
                        isOverdueOnly
                            ? 'Great news! There are currently no overdue books.'
                            : 'No borrowing transactions found matching the selected filters.'
                    }
                />

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 text-xs text-slate-600">
                        <span>
                            Showing page <strong className="text-slate-900">{pagination.current_page}</strong> of{' '}
                            <strong className="text-slate-900">{pagination.last_page}</strong> ({pagination.total} total)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.current_page <= 1}
                                onClick={() => fetchLoans(pagination.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => fetchLoans(pagination.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Issue Loan Modal */}
            <Modal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                title="Issue Book Loan"
                description="Check out an available physical copy to a registered member."
                size="md"
            >
                <form onSubmit={handleIssueLoan} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Select Available Book Copy *
                        </label>
                        <select
                            required
                            value={issueForm.book_copy_id}
                            onChange={(e) => setIssueForm({ ...issueForm, book_copy_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose Available Copy --</option>
                            {availableCopies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.book?.title} [{c.barcode}] ({c.condition})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Select Borrower (Member) *
                        </label>
                        <select
                            required
                            value={issueForm.user_id}
                            onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose Member --</option>
                            {membersList.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Borrow Date"
                            type="date"
                            required
                            value={issueForm.borrowed_at}
                            onChange={(e) => setIssueForm({ ...issueForm, borrowed_at: e.target.value })}
                        />
                        <Input
                            label="Due Date"
                            type="date"
                            required
                            value={issueForm.due_at}
                            onChange={(e) => setIssueForm({ ...issueForm, due_at: e.target.value })}
                        />
                    </div>

                    {/* Quick Due Date Presets */}
                    <div>
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Quick Loan Period:
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPresetDays(7)}
                                className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetDays(14)}
                                className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                14 Days (Standard)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetDays(30)}
                                className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                30 Days (Extended)
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={actionLoading}>
                            Confirm Checkout
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Return Modal */}
            <Modal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                title="Process Book Return"
                description="Mark this book copy as returned and restore its shelf availability."
                size="sm"
            >
                {selectedLoan && (
                    <form onSubmit={handleReturnLoan} className="space-y-4">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-900">{selectedLoan.book_copy?.book?.title}</p>
                            <p className="text-slate-600 font-mono">Barcode: {selectedLoan.book_copy?.barcode}</p>
                            <p className="text-slate-600">Borrower: {selectedLoan.user?.name}</p>
                        </div>

                        <Input
                            label="Return Date *"
                            type="date"
                            required
                            value={returnForm.returned_at}
                            onChange={(e) => setReturnForm({ ...returnForm, returned_at: e.target.value })}
                        />

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="success" loading={actionLoading}>
                                Complete Return
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

