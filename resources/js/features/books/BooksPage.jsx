import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Plus, 
    BookOpen, 
    Edit, 
    Trash2, 
    Barcode, 
    Sparkles, 
    Check, 
    Layers,
    Filter
} from 'lucide-react';
import { booksService } from '../../services/booksService';
import { categoriesService } from '../../services/categoriesService';
import { useToast } from '../../app/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function BooksPage({ onManageCopies, onAiSummarize }) {
    const { showToast } = useToast();
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Add / Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isbn, setIsbn] = useState('');
    const [description, setDescription] = useState('');
    const [initialCopies, setInitialCopies] = useState(2);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Delete state
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadCategories = async () => {
        const res = await categoriesService.getCategories();
        if (res.success) {
            setCategories(res.data?.data || res.data || []);
        }
    };

    const loadBooks = async () => {
        setLoading(true);
        const res = await booksService.getBooks({
            page,
            category_id: selectedCategory,
            search: searchQuery.trim() || undefined,
            per_page: 9,
        });

        if (res.success) {
            setBooks(res.data?.data || []);
            setTotalPages(res.data?.last_page || 1);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadBooks();
    }, [selectedCategory, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadBooks();
    };

    const handleOpenCreate = () => {
        setEditingBook(null);
        setTitle('');
        setAuthors('');
        setCategoryId(categories[0]?.id || '');
        setIsbn('');
        setDescription('');
        setInitialCopies(2);
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (book) => {
        setEditingBook(book);
        setTitle(book.title);
        setAuthors(book.authors || '');
        setCategoryId(book.category_id || '');
        setIsbn(book.isbn || '');
        setDescription(book.description || '');
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSaveBook = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        const payload = {
            title,
            authors,
            category_id: Number(categoryId),
            isbn: isbn || null,
            description: description || null,
        };

        const res = editingBook 
            ? await booksService.updateBook(editingBook.id, payload)
            : await booksService.createBook(payload);

        setFormLoading(false);

        if (!res.success) {
            setFormError(res.error || 'Failed to save book record.');
            return;
        }

        // If creating new book, also create initial physical copies
        if (!editingBook && res.data?.id && initialCopies > 0) {
            await booksService.addCopies(res.data.id, Number(initialCopies), 'new');
        }

        showToast(editingBook ? 'Book updated successfully!' : 'Book created with physical copies!');
        setIsModalOpen(false);
        loadBooks();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);

        const res = await booksService.deleteBook(deleteId);
        setDeleteLoading(false);
        setDeleteId(null);

        if (!res.success) {
            showToast(res.error || 'Cannot delete book.', 'error');
            return;
        }

        showToast('Book removed from catalog.');
        loadBooks();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Books Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Create, edit, classify, and manage library catalog titles</p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, author, or ISBN..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 shadow-2xs"
                        />
                    </form>

                    <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
                        Add Book
                    </Button>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                    onClick={() => { setSelectedCategory(null); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === null
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    All Categories
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            selectedCategory === cat.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
                    <span>Loading books catalog...</span>
                </div>
            ) : books.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">No books found in this view</h4>
                    <p className="text-xs text-slate-400 mt-1">Try another search term or click "Add Book" above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {books.map((book) => (
                        <div 
                            key={book.id} 
                            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <Badge variant="primary" size="xs">
                                        {book.category?.name || 'General'}
                                    </Badge>
                                    {book.isbn && (
                                        <span className="text-[10px] font-mono text-slate-400">
                                            ISBN: {book.isbn}
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                    {book.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">By {book.authors || 'Unknown'}</p>

                                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                                    {book.description || 'No detailed description.'}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onManageCopies?.(book)}
                                        title="View physical copies & barcodes"
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Barcode className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onAiSummarize?.(book)}
                                        title="Generate Gemini AI summary"
                                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(book)}
                                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(book.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-slate-500 font-medium px-2">
                        Page {page} of {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Add / Edit Book Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingBook ? 'Edit Book Details' : 'Register New Book Title'}
                description="Save book entry to the catalog with metadata and initial physical copies"
            >
                <form onSubmit={handleSaveBook} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                            {formError}
                        </div>
                    )}

                    <Input
                        label="Book Title *"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Clean Code"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Author(s) *"
                            required
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                            placeholder="e.g. Robert C. Martin"
                        />

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                            >
                                <option value="">Select category...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="ISBN (Optional)"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            placeholder="e.g. 9780132350884"
                        />

                        {!editingBook && (
                            <Input
                                label="Initial Copies Count"
                                type="number"
                                min="0"
                                max="20"
                                value={initialCopies}
                                onChange={(e) => setInitialCopies(e.target.value)}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Synopsis or notes..."
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                        <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" loading={formLoading}>
                            {editingBook ? 'Save Changes' : 'Create Book'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Book Record"
                message="Are you sure you want to delete this book? This will permanently remove the record and any associated physical copies from the library catalog."
                confirmText="Yes, Delete Book"
                loading={deleteLoading}
            />
        </div>
    );
}

