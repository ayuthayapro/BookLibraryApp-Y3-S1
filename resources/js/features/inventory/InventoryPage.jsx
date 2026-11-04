import React, { useState, useEffect, useCallback } from 'react';
import { 
    Layers, 
    Plus, 
    Search, 
    Barcode, 
    Printer, 
    Trash2, 
    Edit, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertTriangle,
    Copy,
    Check,
    RefreshCw
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Table from '../../components/common/Table';
import { copiesService } from '../../services/copiesService';
import { booksService } from '../../services/booksService';
import { useToast } from '../../app/ToastContext';
import { formatDate } from '../../lib/utils';

export default function InventoryPage({ onNavigateToScanner }) {
    const { showToast } = useToast();

    // Data states
    const [copies, setCopies] = useState([]);
    const [booksList, setBooksList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Filter states
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState(null);
    const [activeBarcodeData, setActiveBarcodeData] = useState(null);
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [copiedBarcode, setCopiedBarcode] = useState(null);

    // Form states
    const [addForm, setAddForm] = useState({
        book_id: '',
        barcode: '',
        condition: 'good',
    });

    const [bulkForm, setBulkForm] = useState({
        book_id: '',
        count: 5,
        condition: 'good',
        prefix: 'LIB',
    });

    const [editForm, setEditForm] = useState({
        barcode: '',
        condition: 'good',
    });

    const [actionLoading, setActionLoading] = useState(false);

    // Fetch copies
    const fetchCopies = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, per_page: 15 };
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;
            if (conditionFilter) params.condition = conditionFilter;

            const res = await copiesService.getCopies(params);
            setCopies(res.data || []);
            setPagination({
                current_page: res.current_page || 1,
                last_page: res.last_page || 1,
                total: res.total || 0,
            });
        } catch (err) {
            showToast(err.message || 'Failed to load inventory copies', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, conditionFilter, showToast]);

    // Fetch books for selection
    const fetchBooksList = async () => {
        try {
            const res = await booksService.getBooks({ per_page: 100 });
            setBooksList(res.data || []);
        } catch (err) {
            console.error('Failed to load books for dropdown', err);
        }
    };

    useEffect(() => {
        fetchCopies(1);
    }, [fetchCopies]);

    useEffect(() => {
        fetchBooksList();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCopies(1);
    };

    // Add single copy
    const handleAddCopy = async (e) => {
        e.preventDefault();
        if (!addForm.book_id) {
            showToast('Please select a book', 'error');
            return;
        }

        try {
            setActionLoading(true);
            const payload = {
                book_id: parseInt(addForm.book_id, 10),
                condition: addForm.condition,
            };
            if (addForm.barcode.trim()) {
                payload.barcode = addForm.barcode.trim();
            }

            await copiesService.createCopy(payload);
            showToast('Physical copy added successfully', 'success');
            setIsAddModalOpen(false);
            setAddForm({ book_id: '', barcode: '', condition: 'good' });
            fetchCopies(1);
        } catch (err) {
            showToast(err.message || 'Failed to create book copy', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk add copies
    const handleBulkAdd = async (e) => {
        e.preventDefault();
        if (!bulkForm.book_id) {
            showToast('Please select a book', 'error');
            return;
        }

        try {
            setActionLoading(true);
            await copiesService.bulkCreateCopies({
                book_id: parseInt(bulkForm.book_id, 10),
                count: parseInt(bulkForm.count, 10),
                condition: bulkForm.condition,
                prefix: bulkForm.prefix.trim() || undefined,
            });
            showToast(`${bulkForm.count} copies generated successfully`, 'success');
            setIsBulkModalOpen(false);
            setBulkForm({ book_id: '', count: 5, condition: 'good', prefix: 'LIB' });
            fetchCopies(1);
        } catch (err) {
            showToast(err.message || 'Failed to generate bulk copies', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Edit copy
    const openEditModal = (copy) => {
        setSelectedCopy(copy);
        setEditForm({
            barcode: copy.barcode || '',
            condition: copy.condition || 'good',
        });
        setIsEditModalOpen(true);
    };

    const handleEditCopy = async (e) => {
        e.preventDefault();
        if (!selectedCopy) return;

        try {
            setActionLoading(true);
            await copiesService.updateCopy(selectedCopy.id, editForm);
            showToast('Copy updated successfully', 'success');
            setIsEditModalOpen(false);
            setSelectedCopy(null);
            fetchCopies(pagination.current_page);
        } catch (err) {
            showToast(err.message || 'Failed to update copy', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Barcode label modal
    const openBarcodeLabel = async (copy) => {
        setSelectedCopy(copy);
        try {
            const labelData = await copiesService.getBarcodeLabel(copy.id);
            setActiveBarcodeData(labelData);
            setIsBarcodeModalOpen(true);
        } catch (err) {
            showToast('Failed to fetch barcode label', 'error');
        }
    };

    // Delete copy
    const confirmDelete = async () => {
        if (!deleteCandidate) return;
        try {
            setActionLoading(true);
            await copiesService.deleteCopy(deleteCandidate.id);
            showToast('Copy removed from inventory', 'success');
            setDeleteCandidate(null);
            fetchCopies(pagination.current_page);
        } catch (err) {
            showToast(err.message || 'Failed to delete copy', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedBarcode(text);
        setTimeout(() => setCopiedBarcode(null), 2000);
        showToast('Barcode copied to clipboard', 'info');
    };

    // Print barcode sheet
    const handlePrintBarcode = () => {
        window.print();
    };

    // Render SVG Barcode bars representation
    const renderSvgBarcode = (code) => {
        if (!code) return null;
        // Generate pseudo CODE-128 bars from string
        const bars = [];
        let x = 10;
        for (let i = 0; i < code.length; i++) {
            const charCode = code.charCodeAt(i);
            const w1 = (charCode % 3) + 1;
            const w2 = ((charCode * 3) % 4) + 1;
            bars.push(<rect key={`b1-${i}`} x={x} y="0" width={w1 * 2} height="60" fill="#0f172a" />);
            x += (w1 * 2) + 2;
            bars.push(<rect key={`b2-${i}`} x={x} y="0" width={w2 * 2} height="60" fill="#0f172a" />);
            x += (w2 * 2) + 3;
        }

        return (
            <svg viewBox={`0 0 ${Math.max(x + 10, 260)} 70`} className="w-full h-16 max-w-xs mx-auto">
                {bars}
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header & Quick stats banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Layers className="w-7 h-7 text-blue-600" />
                        Inventory & Physical Copies
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track physical shelf copies, barcodes, wear condition, and borrowing availability.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    {onNavigateToScanner && (
                        <Button 
                            variant="secondary" 
                            icon={Barcode}
                            onClick={onNavigateToScanner}
                        >
                            Barcode Scanner
                        </Button>
                    )}
                    <Button 
                        variant="secondary" 
                        icon={Plus} 
                        onClick={() => setIsBulkModalOpen(true)}
                    >
                        Bulk Add
                    </Button>
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add Single Copy
                    </Button>
                </div>
            </div>

            {/* Filter controls */}
            <Card className="p-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by barcode, book title, or ISBN..."
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="available">Available on Shelf</option>
                            <option value="borrowed">Currently Borrowed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Condition
                        </label>
                        <select
                            value={conditionFilter}
                            onChange={(e) => setConditionFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Conditions</option>
                            <option value="new">New / Mint</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor / Worn</option>
                        </select>
                    </div>
                </form>
            </Card>

            {/* Copies Table */}
            <Card className="overflow-hidden">
                <Table
                    columns={[
                        {
                            header: 'Barcode / ID',
                            render: (item) => (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs">
                                        <Barcode className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-slate-900 text-xs">
                                                {item.barcode}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(item.barcode)}
                                                className="text-slate-400 hover:text-slate-600"
                                                title="Copy barcode"
                                            >
                                                {copiedBarcode === item.barcode ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            Copy #{item.id}
                                        </span>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: 'Book Title',
                            render: (item) => (
                                <div>
                                    <span className="font-bold text-slate-900 block truncate max-w-xs">
                                        {item.book?.title || 'Unknown Title'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        ISBN: {item.book?.isbn || 'N/A'} • {item.book?.category?.name || 'General'}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            header: 'Condition',
                            render: (item) => {
                                const map = {
                                    new: 'success',
                                    good: 'info',
                                    fair: 'warning',
                                    poor: 'danger',
                                };
                                return (
                                    <Badge variant={map[item.condition] || 'default'} size="sm">
                                        {item.condition?.toUpperCase() || 'GOOD'}
                                    </Badge>
                                );
                            },
                        },
                        {
                            header: 'Circulation Status',
                            render: (item) => {
                                const isAvail = item.is_available ?? (item.status === 'available');
                                return isAvail ? (
                                    <Badge variant="success" dot size="sm">
                                        Available
                                    </Badge>
                                ) : (
                                    <Badge variant="warning" dot size="sm">
                                        Borrowed
                                        {item.active_loan?.user?.name && ` (${item.active_loan.user.name})`}
                                    </Badge>
                                );
                            },
                        },
                        {
                            header: 'Added',
                            render: (item) => (
                                <span className="text-xs text-slate-500">
                                    {formatDate(item.created_at)}
                                </span>
                            ),
                        },
                        {
                            header: 'Actions',
                            align: 'right',
                            render: (item) => (
                                <div className="flex items-center justify-end gap-1.5">
                                    <button
                                        onClick={() => openBarcodeLabel(item)}
                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Print Barcode Label"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit Condition"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteCandidate(item)}
                                        disabled={!item.is_available && item.status !== 'available'}
                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                        title="Delete Copy"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={copies}
                    keyExtractor={(item) => item.id}
                    loading={loading}
                    emptyMessage="No physical copies found matching your criteria."
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
                                onClick={() => fetchCopies(pagination.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => fetchCopies(pagination.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Add Single Copy Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Physical Book Copy"
                description="Register a single copy with an existing book title."
                size="md"
            >
                <form onSubmit={handleAddCopy} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Select Book Title *
                        </label>
                        <select
                            required
                            value={addForm.book_id}
                            onChange={(e) => setAddForm({ ...addForm, book_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose Book Title --</option>
                            {booksList.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title} ({b.isbn || 'No ISBN'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Custom Barcode (Optional)"
                        placeholder="Leave blank to auto-generate (e.g. LIB-A9B2C3D4)"
                        value={addForm.barcode}
                        onChange={(e) => setAddForm({ ...addForm, barcode: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Physical Condition
                        </label>
                        <select
                            value={addForm.condition}
                            onChange={(e) => setAddForm({ ...addForm, condition: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="new">New / Mint</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor / Worn</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={actionLoading}>
                            Create Copy
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Add Modal */}
            <Modal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                title="Bulk Generate Book Copies"
                description="Quickly generate multiple inventory units with unique auto-generated barcodes."
                size="md"
            >
                <form onSubmit={handleBulkAdd} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Target Book Title *
                        </label>
                        <select
                            required
                            value={bulkForm.book_id}
                            onChange={(e) => setBulkForm({ ...bulkForm, book_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose Book Title --</option>
                            {booksList.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title} ({b.isbn || 'No ISBN'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Number of Copies to Generate *"
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={bulkForm.count}
                        onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                    />

                    <Input
                        label="Barcode Prefix"
                        placeholder="e.g. LIB, MAIN, SCI"
                        value={bulkForm.prefix}
                        onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Initial Physical Condition
                        </label>
                        <select
                            value={bulkForm.condition}
                            onChange={(e) => setBulkForm({ ...bulkForm, condition: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="new">New / Mint</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={actionLoading}>
                            Generate {bulkForm.count || 0} Copies
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Physical Copy"
                size="sm"
            >
                <form onSubmit={handleEditCopy} className="space-y-4">
                    <Input
                        label="Barcode String *"
                        required
                        value={editForm.barcode}
                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Condition
                        </label>
                        <select
                            value={editForm.condition}
                            onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="new">New / Mint</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor / Worn</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={actionLoading}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Printable Barcode Label Modal */}
            <Modal
                isOpen={isBarcodeModalOpen}
                onClose={() => setIsBarcodeModalOpen(false)}
                title="Print Barcode Label"
                description="CODE-128 physical sticker label ready for thermal or standard printing."
                size="md"
            >
                {selectedCopy && (
                    <div className="space-y-6">
                        {/* Printable Label Preview Card */}
                        <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
                            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-1">
                                Book Library Central
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm max-w-sm truncate">
                                {selectedCopy.book?.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 mb-3">
                                ISBN: {selectedCopy.book?.isbn || 'N/A'} • Copy ID: #{selectedCopy.id}
                            </p>

                            {/* Barcode SVG */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 w-full flex flex-col items-center">
                                {renderSvgBarcode(selectedCopy.barcode)}
                                <span className="font-mono font-black text-slate-900 tracking-wider text-sm mt-1">
                                    {selectedCopy.barcode}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mt-3">
                                <span>Condition: <strong className="text-slate-900">{selectedCopy.condition}</strong></span>
                                <span>Format: <strong className="text-slate-900">CODE-128</strong></span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsBarcodeModalOpen(false)}>
                                Close
                            </Button>
                            <Button variant="primary" icon={Printer} onClick={handlePrintBarcode}>
                                Print Label
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteCandidate}
                onClose={() => setDeleteCandidate(null)}
                onConfirm={confirmDelete}
                title="Remove Copy from Inventory?"
                message={`Are you sure you want to permanently remove copy "${deleteCandidate?.barcode}"? This action cannot be undone.`}
                confirmText="Delete Copy"
                loading={actionLoading}
            />
        </div>
    );
}

