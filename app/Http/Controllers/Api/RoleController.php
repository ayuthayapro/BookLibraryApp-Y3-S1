<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignPermissionRequest;
use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    /**
     * Display a listing of all roles with their permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json([
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? ucfirst($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Role created successfully.',
            'role' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'role' => $role->load('permissions'),
        ]);
    }

    /**
     * Display all available system permissions.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();

        return response()->json([
            'permissions' => $permissions,
        ]);
    }

    /**
     * Assign / synchronize roles for a specific user.
     */
    public function assignRolesToUser(AssignRoleRequest $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        $validated = $request->validated();

        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'Roles assigned successfully.',
            'user' => $user->fresh(['roles', 'permissions']),
        ]);
    }

    /**
     * Assign / synchronize direct permissions for a specific user.
     */
    public function assignPermissionsToUser(AssignPermissionRequest $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        $validated = $request->validated();

        $user->syncPermissions($validated['permissions']);

        return response()->json([
            'message' => 'Permissions assigned successfully.',
            'user' => $user->fresh(['roles', 'permissions']),
        ]);
    }
}
