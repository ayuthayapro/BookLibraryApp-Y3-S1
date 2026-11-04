import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Shield, 
    Plus, 
    CheckCircle2, 
    User, 
    Key, 
    Lock, 
    Users, 
    AlertTriangle,
    Save,
    RefreshCw
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { rolesService } from '../../services/rolesService';
import { membersService } from '../../services/membersService';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';

export default function AdministratorsPage() {
    const { user: currentUser, isAdmin } = useAuth();
    const { showToast } = useToast();

    // Data states
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selected User assignment state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUserRoles, setSelectedUserRoles] = useState([]);
    const [selectedUserPermissions, setSelectedUserPermissions] = useState([]);
    const [savingAssignment, setSavingAssignment] = useState(false);

    // New Role Modal
    const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
    const [newRoleForm, setNewRoleForm] = useState({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
    });
    const [creatingRole, setCreatingRole] = useState(false);

    // Fetch initial data
    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes, membersRes] = await Promise.all([
                rolesService.getRoles(),
                rolesService.getPermissions(),
                membersService.getMembers({ per_page: 100 }),
            ]);

            const loadedRoles = rolesRes.roles || rolesRes.data || rolesRes || [];
            const loadedPerms = permsRes.permissions || permsRes.data || permsRes || [];
            const loadedMembers = membersRes.data || membersRes || [];

            setRoles(loadedRoles);
            setPermissions(loadedPerms);
            setMembers(loadedMembers);

            // Select current user by default if available
            if (currentUser && !selectedUserId) {
                const me = loadedMembers.find((m) => m.id === currentUser.id);
                if (me) {
                    selectMemberForAssignment(me);
                } else if (loadedMembers.length > 0) {
                    selectMemberForAssignment(loadedMembers[0]);
                }
            }
        } catch (err) {
            showToast(err.message || 'Failed to load security permissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Set member when selected from dropdown
    const selectMemberForAssignment = (member) => {
        setSelectedUserId(member.id);
        setSelectedUserRoles(member.roles ? member.roles.map((r) => r.name) : []);
        setSelectedUserPermissions(member.permissions ? member.permissions.map((p) => p.name) : []);
    };

    const handleMemberChange = (e) => {
        const id = parseInt(e.target.value, 10);
        setSelectedUserId(id);
        const m = members.find((u) => u.id === id);
        if (m) {
            setSelectedUserRoles(m.roles ? m.roles.map((r) => r.name) : []);
            setSelectedUserPermissions(m.permissions ? m.permissions.map((p) => p.name) : []);
        }
    };

    // Save assigned roles and permissions
    const handleSaveAssignments = async () => {
        if (!selectedUserId) return;

        try {
            setSavingAssignment(true);
            await Promise.all([
                rolesService.assignRolesToUser(selectedUserId, selectedUserRoles),
                rolesService.assignPermissionsToUser(selectedUserId, selectedUserPermissions),
            ]);

            showToast('User security roles & permissions updated successfully', 'success');

            // Refresh members in background
            const membersRes = await membersService.getMembers({ per_page: 100 });
            setMembers(membersRes.data || []);
        } catch (err) {
            showToast(err.message || 'Failed to update roles', 'error');
        } finally {
            setSavingAssignment(false);
        }
    };

    // Create custom role
    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleForm.name.trim()) {
            showToast('Role system key is required', 'error');
            return;
        }

        try {
            setCreatingRole(true);
            await rolesService.createRole({
                name: newRoleForm.name.toLowerCase().trim().replace(/\s+/g, '-'),
                display_name: newRoleForm.display_name.trim() || newRoleForm.name,
                description: newRoleForm.description.trim(),
                permissions: newRoleForm.permissions,
            });

            showToast('Custom role created successfully', 'success');
            setIsCreateRoleModalOpen(false);
            setNewRoleForm({ name: '', display_name: '', description: '', permissions: [] });
            loadData();
        } catch (err) {
            showToast(err.message || 'Failed to create role', 'error');
        } finally {
            setCreatingRole(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-purple-600" />
                        Super-Admin Roles & Access Control
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure role-based access control (RBAC), assign system permissions, and enforce administrative gates.
                    </p>
                </div>
                <Button 
                    variant="primary" 
                    icon={Plus} 
                    onClick={() => setIsCreateRoleModalOpen(true)}
                >
                    Create Custom Role
                </Button>
            </div>

            {/* Super Admin Notice */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950">
                    <strong className="font-extrabold block text-sm mb-0.5">
                        High Privilege Security Zone
                    </strong>
                    Role assignments grant direct access to sensitive features including inventory write operations, member account management, and database records. Changes take effect on the user's next API request.
                </div>
            </div>

            {/* System Roles Grid */}
            <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                    Configured System Roles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.map((r) => (
                        <Card key={r.id || r.name} className="p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-extrabold text-slate-900 text-base capitalize">
                                        {r.display_name || r.name}
                                    </h4>
                                    <Badge 
                                        variant={r.name === 'admin' ? 'purple' : (r.name === 'librarian' ? 'info' : 'default')} 
                                        size="xs"
                                    >
                                        {r.name.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 min-h-8">
                                    {r.description || `Standard system access for ${r.name}.`}
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                    <strong className="text-slate-800">{r.permissions ? r.permissions.length : 0}</strong> permissions
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                    Role ID #{r.id}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* User Assignment Station */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <Key className="w-5 h-5 text-blue-600" />
                            User Privilege Assignment
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select a user to review and update their granted roles and direct capabilities.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={selectedUserId}
                            onChange={handleMemberChange}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-w-60"
                        >
                            <option value="">-- Select Member / Staff --</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="primary"
                            icon={Save}
                            loading={savingAssignment}
                            disabled={!selectedUserId}
                            onClick={handleSaveAssignments}
                        >
                            Save Privileges
                        </Button>
                    </div>
                </div>

                {selectedUserId && (
                    <div className="pt-6 space-y-6">
                        {/* Roles checkboxes */}
                        <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                Assign System Roles
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {roles.map((r) => {
                                    const isAssigned = selectedUserRoles.includes(r.name);
                                    return (
                                        <div
                                            key={r.name}
                                            onClick={() => {
                                                if (isAssigned) {
                                                    setSelectedUserRoles(selectedUserRoles.filter((name) => name !== r.name));
                                                } else {
                                                    setSelectedUserRoles([...selectedUserRoles, r.name]);
                                                }
                                            }}
                                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                                isAssigned
                                                    ? 'border-purple-600 bg-purple-50/40 text-purple-950 shadow-xs'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isAssigned}
                                                readOnly
                                                className="mt-0.5 rounded-md text-purple-600 focus:ring-purple-500 pointer-events-none"
                                            />
                                            <div>
                                                <h5 className="font-extrabold text-xs capitalize text-slate-900">
                                                    {r.display_name || r.name}
                                                </h5>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {r.description || `Grants ${r.name} capabilities`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Direct Granular Permissions Checklist */}
                        <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                Direct Granular Permissions
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {permissions.map((p) => {
                                    const isGranted = selectedUserPermissions.includes(p.name);
                                    return (
                                        <label
                                            key={p.name}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition-colors ${
                                                isGranted
                                                    ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isGranted}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUserPermissions([...selectedUserPermissions, p.name]);
                                                    } else {
                                                        setSelectedUserPermissions(selectedUserPermissions.filter((name) => name !== p.name));
                                                    }
                                                }}
                                                className="rounded-md text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="truncate" title={p.display_name || p.name}>
                                                {p.display_name || p.name}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Create Custom Role Modal */}
            <Modal
                isOpen={isCreateRoleModalOpen}
                onClose={() => setIsCreateRoleModalOpen(false)}
                title="Create Custom Security Role"
                description="Define a new role and choose default permission bindings."
                size="md"
            >
                <form onSubmit={handleCreateRole} className="space-y-4">
                    <Input
                        label="Role Identifier Key *"
                        required
                        placeholder="e.g. inventory-clerk, supervisor"
                        value={newRoleForm.name}
                        onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                    />

                    <Input
                        label="Display Name *"
                        required
                        placeholder="e.g. Inventory Clerk"
                        value={newRoleForm.display_name}
                        onChange={(e) => setNewRoleForm({ ...newRoleForm, display_name: e.target.value })}
                    />

                    <Input
                        label="Description"
                        placeholder="Brief summary of duties and privileges..."
                        value={newRoleForm.description}
                        onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Bind Default Permissions
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                            {permissions.map((p) => (
                                <label key={p.name} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={newRoleForm.permissions.includes(p.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setNewRoleForm({ ...newRoleForm, permissions: [...newRoleForm.permissions, p.name] });
                                            } else {
                                                setNewRoleForm({ ...newRoleForm, permissions: newRoleForm.permissions.filter((n) => n !== p.name) });
                                            }
                                        }}
                                        className="rounded-md text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="truncate">{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsCreateRoleModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={creatingRole}>
                            Create Role
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

