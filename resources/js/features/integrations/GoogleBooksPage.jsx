import React, { useState, useEffect } from 'react';
import { 
    Globe, 
    Search, 
    Download, 
    CheckCircle2, 
    ExternalLink, 
    BookOpen, 
    Layers,
    Sparkles,
    Check
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { integrationsService } from '../../services/integrationsService';
import { categoriesService } from '../../services/categoriesService';
import { useToast } from '../../app/ToastContext';
import { toSafeArray } from '../../lib/utils';

export default function GoogleBooksPage({ onImportSuccess }) {
    const { showToast } = useToast();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    // Import modal
    const [selectedBook, setSelectedBook] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importForm, setImportForm] = useState({
        copies_count: 2,
        condition: 'new',
        category_id: '',
    });
    const [importing, setImporting] = useState(false);
    const [importedIds, setImportedIds] = useState(new Set());

    // Load categories for assignment
    useEffect(() => {
        categoriesService.getCategories().then((res) => {
            setCategories(toSafeArray(res));
        }).catch(() => {});
    }, []);

    // Perform Google Books search
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const q = query.trim();
        if (!q) return;

        try {
            setLoading(true);
            const res = await integrationsService.searchGoogleBooks(q, 12);
            setResults(toSafeArray(res, 'items'));
            setTotalItems(res.total_items || res.data?.total_items || 0);
        } catch (err) {
            showToast(err.message || 'Google Books search failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Open import modal
    const openImportModal = (book) => {
        setSelectedBook(book);
        setIsImportModalOpen(true);
    };

    // Confirm Import
    const handleConfirmImport = async (e) => {
        e.preventDefault();
        if (!selectedBook) return;

        try {
            setImporting(true);
            await integrationsService.importGoogleBook(
                selectedBook.google_book_id || selectedBook.id,
                parseInt(importForm.copies_count, 10),
                importForm.condition,
                importForm.category_id ? parseInt(importForm.category_id, 10) : null
            );

            showToast(`"${selectedBook.title}" imported with ${importForm.copies_count} copies!`, 'success');
            setImportedIds((prev) => new Set(prev).add(selectedBook.google_book_id || selectedBook.id));
            setIsImportModalOpen(false);
            setSelectedBook(null);

            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (err) {
            showToast(err.message || 'Failed to import book into catalog', 'error');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Globe className="w-7 h-7 text-blue-600" />
                    Google Books Online Catalog Sync
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Search millions of official titles, retrieve metadata and covers, and import directly into the library inventory.
                </p>
            </div>

            {/* Search Input Station */}
            <Card className="p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search by title, author, or ISBN (e.g. Clean Code, Machine Learning)..."
                                icon={Search}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            loading={loading}
                            icon={Search}
                        >
                            Search Books
                        </Button>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-slate-500">Popular Queries:</span>
                        {['Clean Code', 'Artificial Intelligence', 'Data Science', 'Laravel', 'Design Patterns'].map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                    setQuery(chip);
                                    integrationsService.searchGoogleBooks(chip, 12).then((res) => {
                                        setResults(toSafeArray(res, 'items'));
                                        setTotalItems(res.total_items || res.data?.total_items || 0);
                                    }).catch(() => {});
                                }}
                                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </form>
            </Card>

            {/* Results Grid */}
            {results.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Found {totalItems} titles in Google Books database
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((book) => {
                            const isImported = importedIds.has(book.google_book_id || book.id);
                            return (
                                <Card key={book.google_book_id || book.id} className="p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                                    <div className="flex gap-4">
                                        {book.thumbnail ? (
                                            <img
                                                src={book.thumbnail}
                                                alt={book.title}
                                                className="w-20 h-28 object-cover rounded-lg shadow-xs shrink-0 border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-20 h-28 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 text-sm line-clamp-2" title={book.title}>
                                                {book.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                {Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                                                <span>{book.published_year || 'N/A'}</span>
                                                {book.page_count && <span>• {book.page_count} p.</span>}
                                            </div>
                                            {book.isbn && (
                                                <span className="font-mono text-[10px] text-blue-600 block mt-1">
                                                    ISBN: {book.isbn}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        {isImported ? (
                                            <Badge variant="success" size="xs" icon={Check}>
                                                Imported
                                            </Badge>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                icon={Download}
                                                onClick={() => openImportModal(book)}
                                            >
                                                Import to Library
                                            </Button>
                                        )}

                                        {book.info_link && (
                                            <a
                                                href={book.info_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-slate-400 hover:text-slate-600 p-1"
                                                title="View on Google Books"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Import Configuration Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Book into Library"
                description="This will register the book title and generate initial physical copies in your inventory."
                size="md"
            >
                {selectedBook && (
                    <form onSubmit={handleConfirmImport} className="space-y-4">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <span className="font-extrabold text-slate-900 block text-sm">{selectedBook.title}</span>
                            <span className="text-slate-500">
                                {Array.isArray(selectedBook.authors) ? selectedBook.authors.join(', ') : selectedBook.authors}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Assign Classification Category
                            </label>
                            <select
                                value={importForm.category_id}
                                onChange={(e) => setImportForm({ ...importForm, category_id: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Choose Category (Optional) --</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Number of Physical Copies to Stock *"
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={importForm.copies_count}
                            onChange={(e) => setImportForm({ ...importForm, copies_count: e.target.value })}
                        />

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Physical Condition of Stock
                            </label>
                            <select
                                value={importForm.condition}
                                onChange={(e) => setImportForm({ ...importForm, condition: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="new">New / Mint</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" loading={importing}>
                                Confirm & Import
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

