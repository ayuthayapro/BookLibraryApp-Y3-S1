import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { categoriesService } from '../../services/categoriesService';
import { useToast } from '../../app/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { toSafeArray } from '../../lib/utils';

export default function CategoriesPage() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Delete state
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        const res = await categoriesService.getCategories();
        setCategories(toSafeArray(res));
        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setCategoryName('');
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        const res = editingCategory 
            ? await categoriesService.updateCategory(editingCategory.id, categoryName)
            : await categoriesService.createCategory(categoryName);

        setFormLoading(false);

        if (!res.success) {
            setFormError(res.error || 'Failed to save category.');
            return;
        }

        showToast(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        setIsModalOpen(false);
        loadCategories();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);

        const res = await categoriesService.deleteCategory(deleteId);
        setDeleteLoading(false);
        setDeleteId(null);

        if (!res.success) {
            showToast(res.error || 'Cannot delete category that contains books.', 'error');
            return;
        }

        showToast('Category deleted successfully.');
        loadCategories();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Category Classification</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Organize and group library titles by discipline and subject</p>
                </div>

                <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
                    New Category
                </Button>
            </div>

            <Table
                headers={[
                    { label: 'Category ID', className: 'w-24' },
                    { label: 'Category Name' },
                    { label: 'Catalog Titles' },
                    { label: 'Actions', className: 'text-right' },
                ]}
                loading={loading}
                emptyMessage="No categories created yet."
                emptyIcon={FolderTree}
            >
                {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{cat.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{cat.name}</td>
                        <td className="py-3 px-4">
                            <Badge variant="primary" size="xs">
                                {cat.books_count ?? '0'} titles
                            </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                                <button
                                    onClick={() => handleOpenEdit(cat)}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteId(cat.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'Create New Category'}
            >
                <form onSubmit={handleSaveCategory} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                            {formError}
                        </div>
                    )}

                    <Input
                        label="Category Name *"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Artificial Intelligence & Robotics"
                    />

                    <div className="pt-2 flex justify-end gap-2.5">
                        <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" loading={formLoading}>
                            Save Category
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Category"
                message="Are you sure you want to delete this category? If there are existing books assigned to it, the backend will prevent deletion."
                confirmText="Delete Category"
                loading={deleteLoading}
            />
        </div>
    );
}

