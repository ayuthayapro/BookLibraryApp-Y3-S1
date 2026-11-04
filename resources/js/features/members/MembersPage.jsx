import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    Shield, 
    Edit, 
    Trash2, 
    BookOpen, 
    CheckCircle2, 
    AlertCircle, 
    Lock, 
    Eye,
    UserCheck,
    Ban
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Table from '../../components/common/Table';
import { membersService } from '../../services/membersService';
import { authService } from '../../services/authService';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { formatDate } from '../../lib/utils';

export default function MembersPage() {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();

    // Data states
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Filter states
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetails, setMemberDetails] = useState(null);
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'member',
    });

    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        status: 'active',
        password: '',
        roles: [],
    });

    // Fetch members
    const fetchMembers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, per_page: 12 };
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;

            const res = await membersService.getMembers(params);
            setMembers(res.data || []);
            setPagination({
                current_page: res.current_page || 1,
                last_page: res.last_page || 1,
                total: res.total || 0,
            });
        } catch (err) {
            showToast(err.message || 'Failed to fetch members list', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, showToast]);

    useEffect(() => {
        fetchMembers(1);
    }, [fetchMembers]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchMembers(1);
    };

    // Open Details Modal
    const openDetailsModal = async (member) => {
        setSelectedMember(member);
        setIsDetailsModalOpen(true);
        try {
            const res = await membersService.getMember(member.id);
            setMemberDetails(res.user || res);
        } catch (err) {
            showToast('Failed to load member profile details', 'error');
        }
    };

    // Open Edit Modal
    const openEditModal = (member) => {
        setSelectedMember(member);
        setEditForm({
            name: member.name || '',
            email: member.email || '',
            status: member.status || 'active',
            password: '',
            roles: member.roles ? member.roles.map((r) => r.name) : ['member'],
        });
        setIsEditModalOpen(true);
    };

    // Add Member
    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await authService.register(addForm);
            showToast('Member account created successfully', 'success');
            setIsAddModalOpen(false);
            setAddForm({ name: '', email: '', password: '', role: 'member' });
            fetchMembers(1);
        } catch (err) {
            showToast(err.message || 'Failed to register new member', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Edit Member
    const handleEditMember = async (e) => {
        e.preventDefault();
        if (!selectedMember) return;

        try {
            setActionLoading(true);
            const payload = {
                name: editForm.name,
                email: editForm.email,
                status: editForm.status,
                roles: editForm.roles,
            };
            if (editForm.password.trim()) {
                payload.password = editForm.password.trim();
            }

            await membersService.updateMember(selectedMember.id, payload);
            showToast('Member account updated successfully', 'success');
            setIsEditModalOpen(false);
            setSelectedMember(null);
            fetchMembers(pagination.current_page);
        } catch (err) {
            showToast(err.message || 'Failed to update member', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Member
    const confirmDelete = async () => {
        if (!deleteCandidate) return;
        try {
            setActionLoading(true);
            await membersService.deleteMember(deleteCandidate.id);
            showToast('Member account permanently deleted', 'success');
            setDeleteCandidate(null);
            fetchMembers(pagination.current_page);
        } catch (err) {
            showToast(err.message || 'Cannot delete member', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Helper: Role badge styling
    const getRoleBadgeVariant = (roleName) => {
        switch (roleName?.toLowerCase()) {
            case 'admin':
            case 'super-admin':
                return 'purple';
            case 'librarian':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-600" />
                        User & Member Accounts
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage registered library patrons, staff permissions, account statuses, and borrow history.
                    </p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
                    Register Member
                </Button>
            </div>

            {/* Filter Card */}
            <Card className="p-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search member by full name or email address..."
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Account Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Members</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned / Suspended</option>
                        </select>
                    </div>
                </form>
            </Card>

            {/* Members Table */}
            <Card className="overflow-hidden">
                <Table
                    columns={[
                        {
                            header: 'Member / User',
                            render: (m) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                        {m.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {m.name}
                                            </span>
                                            {m.id === currentUser?.id && (
                                                <span className="text-[10px] font-black px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-sm">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 block">
                                            {m.email}
                                        </span>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: 'Assigned Roles',
                            render: (m) => (
                                <div className="flex flex-wrap gap-1">
                                    {m.roles && m.roles.length > 0 ? (
                                        m.roles.map((r) => (
                                            <Badge key={r.id || r.name} variant={getRoleBadgeVariant(r.name)} size="xs">
                                                {r.name?.toUpperCase()}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="default" size="xs">
                                            MEMBER
                                        </Badge>
                                    )}
                                </div>
                            ),
                        },
                        {
                            header: 'Account Status',
                            render: (m) => {
                                const status = m.status || 'active';
                                if (status === 'active') {
                                    return <Badge variant="success" dot size="sm">Active</Badge>;
                                } else if (status === 'banned') {
                                    return <Badge variant="danger" dot size="sm">Banned</Badge>;
                                } else {
                                    return <Badge variant="warning" dot size="sm">Inactive</Badge>;
                                }
                            },
                        },
                        {
                            header: 'Total Borrowed',
                            render: (m) => (
                                <span className="font-semibold text-slate-700 text-xs">
                                    {m.loans_count ?? 0} book{m.loans_count === 1 ? '' : 's'}
                                </span>
                            ),
                        },
                        {
                            header: 'Joined',
                            render: (m) => (
                                <span className="text-xs text-slate-500">
                                    {formatDate(m.created_at)}
                                </span>
                            ),
                        },
                        {
                            header: 'Actions',
                            align: 'right',
                            render: (m) => (
                                <div className="flex items-center justify-end gap-1.5">
                                    <button
                                        onClick={() => openDetailsModal(m)}
                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="View History & Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(m)}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit Account"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteCandidate(m)}
                                        disabled={m.id === currentUser?.id}
                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={members}
                    keyExtractor={(m) => m.id}
                    loading={loading}
                    emptyMessage="No member accounts found matching your query."
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
                                onClick={() => fetchMembers(pagination.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => fetchMembers(pagination.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Register New Member Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Register New Member"
                description="Create a library patron account or staff user profile."
                size="md"
            >
                <form onSubmit={handleAddMember} className="space-y-4">
                    <Input
                        label="Full Name *"
                        required
                        placeholder="e.g. Jane Doe"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    />

                    <Input
                        label="Email Address *"
                        type="email"
                        required
                        placeholder="e.g. jane.doe@example.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    />

                    <Input
                        label="Password *"
                        type="password"
                        required
                        placeholder="At least 8 characters"
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Initial Role
                        </label>
                        <select
                            value={addForm.role}
                            onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="member">Library Member / Patron</option>
                            <option value="librarian">Librarian Staff</option>
                            <option value="admin">Super Administrator</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={actionLoading}>
                            Create Account
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Member Account"
                description="Update name, login status, or assign administrator roles."
                size="md"
            >
                <form onSubmit={handleEditMember} className="space-y-4">
                    <Input
                        label="Full Name *"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />

                    <Input
                        label="Email Address *"
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Account Status
                        </label>
                        <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">Active (Full Access)</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned (Blocked from borrowing)</option>
                        </select>
                    </div>

                    <Input
                        label="Reset Password (Optional)"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Assigned Roles
                        </label>
                        <div className="flex gap-4">
                            {['admin', 'librarian', 'member'].map((role) => (
                                <label key={role} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={editForm.roles.includes(role)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setEditForm({ ...editForm, roles: [...editForm.roles, role] });
                                            } else {
                                                setEditForm({ ...editForm, roles: editForm.roles.filter((r) => r !== role) });
                                            }
                                        }}
                                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="capitalize">{role}</span>
                                </label>
                            ))}
                        </div>
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

            {/* Member Details & History Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setMemberDetails(null);
                }}
                title="Member Profile & Loan History"
                size="lg"
            >
                {selectedMember && (
                    <div className="space-y-6">
                        {/* Member Summary Card */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0">
                                {selectedMember.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    {selectedMember.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono">
                                    {selectedMember.email} • ID: #{selectedMember.id}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={selectedMember.status === 'active' ? 'success' : 'danger'} size="xs" dot>
                                        {selectedMember.status?.toUpperCase() || 'ACTIVE'}
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                        Member since {formatDate(selectedMember.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Loans */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                Borrowing Activity & Loans
                            </h4>
                            {memberDetails?.loans && memberDetails.loans.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {memberDetails.loans.map((loan) => (
                                        <div
                                            key={loan.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <span className="font-bold text-slate-900 block">
                                                    {loan.book_copy?.book?.title || 'Unknown Title'}
                                                </span>
                                                <span className="text-slate-500 font-mono text-[11px]">
                                                    Barcode: {loan.book_copy?.barcode || 'N/A'} • Due: {formatDate(loan.due_at)}
                                                </span>
                                            </div>
                                            <Badge
                                                variant={loan.returned_at ? 'success' : (loan.status === 'overdue' ? 'danger' : 'info')}
                                                size="xs"
                                            >
                                                {loan.returned_at ? 'Returned' : (loan.status === 'overdue' ? 'Overdue' : 'Borrowed')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No loan records on file for this member.</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>
                                Close
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
                title="Delete Member Account?"
                message={`Are you sure you want to permanently delete "${deleteCandidate?.name}" (${deleteCandidate?.email})? Active borrowers must return all books first.`}
                confirmText="Delete Account"
                loading={actionLoading}
            />
        </div>
    );
}

