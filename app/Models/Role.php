<?php

namespace App\Models;

use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'display_name', 'description'])]
class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    /**
     * Get the users assigned this role.
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user')->withTimestamps();
    }

    /**
     * Get the permissions assigned to this role.
     *
     * @return BelongsToMany<Permission, $this>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role')->withTimestamps();
    }

    /**
     * Grant one or more permissions to this role.
     */
    public function givePermissionTo(string|Permission ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $model = is_string($permission)
                ? Permission::firstOrCreate(['name' => $permission])
                : $permission;

            $this->permissions()->syncWithoutDetaching([$model->id]);
        }

        return $this;
    }

    /**
     * Revoke one or more permissions from this role.
     */
    public function revokePermissionTo(string|Permission ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $model = is_string($permission)
                ? Permission::where('name', $permission)->first()
                : $permission;

            if ($model) {
                $this->permissions()->detach($model->id);
            }
        }

        return $this;
    }

    /**
     * Sync permissions for this role.
     *
     * @param  array<int, string|Permission>  $permissions
     */
    public function syncPermissions(array $permissions): static
    {
        $ids = [];

        foreach ($permissions as $permission) {
            $model = is_string($permission)
                ? Permission::firstOrCreate(['name' => $permission])
                : $permission;

            $ids[] = $model->id;
        }

        $this->permissions()->sync($ids);

        return $this;
    }

    /**
     * Check if role has a given permission.
     */
    public function hasPermissionTo(string|Permission $permission): bool
    {
        $permissionName = is_string($permission) ? $permission : $permission->name;

        return $this->permissions->contains('name', $permissionName);
    }
}
