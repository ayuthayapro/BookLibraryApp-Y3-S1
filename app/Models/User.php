<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\RoleName;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the roles assigned to the user.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')->withTimestamps();
    }

    /**
     * Get the permissions directly granted to the user.
     *
     * @return BelongsToMany<Permission, $this>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_user')->withTimestamps();
    }

    /**
     * Assign one or more roles to the user.
     */
    public function assignRole(string|Role|RoleName ...$roles): static
    {
        foreach ($roles as $role) {
            $roleName = match (true) {
                $role instanceof RoleName => $role->value,
                $role instanceof Role => $role->name,
                default => $role,
            };

            $roleModel = Role::firstOrCreate(['name' => $roleName]);
            $this->roles()->syncWithoutDetaching([$roleModel->id]);
        }

        $this->load('roles');

        return $this;
    }

    /**
     * Remove one or more roles from the user.
     */
    public function removeRole(string|Role|RoleName ...$roles): static
    {
        foreach ($roles as $role) {
            $roleName = match (true) {
                $role instanceof RoleName => $role->value,
                $role instanceof Role => $role->name,
                default => $role,
            };

            $roleModel = Role::where('name', $roleName)->first();

            if ($roleModel) {
                $this->roles()->detach($roleModel->id);
            }
        }

        $this->load('roles');

        return $this;
    }

    /**
     * Synchronize roles for the user.
     *
     * @param  array<int, string|Role|RoleName>  $roles
     */
    public function syncRoles(array $roles): static
    {
        $roleIds = [];

        foreach ($roles as $role) {
            $roleName = match (true) {
                $role instanceof RoleName => $role->value,
                $role instanceof Role => $role->name,
                default => $role,
            };

            $roleModel = Role::firstOrCreate(['name' => $roleName]);
            $roleIds[] = $roleModel->id;
        }

        $this->roles()->sync($roleIds);
        $this->load('roles');

        return $this;
    }

    /**
     * Check if user has one or any of the given roles.
     *
     * @param  string|array<int, string|RoleName>|Role|RoleName  $roles
     */
    public function hasRole(string|array|Role|RoleName $roles): bool
    {
        if (is_array($roles)) {
            foreach ($roles as $role) {
                if ($this->hasRole($role)) {
                    return true;
                }
            }

            return false;
        }

        $roleName = match (true) {
            $roles instanceof RoleName => $roles->value,
            $roles instanceof Role => $roles->name,
            default => $roles,
        };

        return $this->roles->contains('name', $roleName);
    }

    /**
     * Check if user has all of the given roles.
     *
     * @param  array<int, string|RoleName>  $roles
     */
    public function hasAllRoles(array $roles): bool
    {
        foreach ($roles as $role) {
            if (! $this->hasRole($role)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Grant one or more direct permissions to the user.
     */
    public function givePermissionTo(string|Permission ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $permissionModel = is_string($permission)
                ? Permission::firstOrCreate(['name' => $permission])
                : $permission;

            $this->permissions()->syncWithoutDetaching([$permissionModel->id]);
        }

        $this->load('permissions');

        return $this;
    }

    /**
     * Revoke one or more direct permissions from the user.
     */
    public function revokePermissionTo(string|Permission ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $permissionModel = is_string($permission)
                ? Permission::where('name', $permission)->first()
                : $permission;

            if ($permissionModel) {
                $this->permissions()->detach($permissionModel->id);
            }
        }

        $this->load('permissions');

        return $this;
    }

    /**
     * Synchronize direct permissions for the user.
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
        $this->load('permissions');

        return $this;
    }

    /**
     * Determine if the user has a given permission directly or via roles.
     */
    public function hasPermissionTo(string|Permission $permission): bool
    {
        $permissionName = is_string($permission) ? $permission : $permission->name;

        // Admin role always has all permissions
        if ($this->hasRole(RoleName::Admin->value)) {
            return true;
        }

        // Direct user permission check
        if ($this->permissions->contains('name', $permissionName)) {
            return true;
        }

        // Role-based permissions check
        foreach ($this->roles as $role) {
            if ($role->permissions->contains('name', $permissionName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all unique permissions for this user (direct and via roles).
     *
     * @return Collection<int, Permission>
     */
    public function getAllPermissions(): Collection
    {
        $rolePermissions = $this->roles->flatMap(fn (Role $role) => $role->permissions);

        return $this->permissions->merge($rolePermissions)->unique('id')->values();
    }

    /**
     * Determine whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(RoleName::Admin->value);
    }

    /**
     * Determine whether the user is a librarian.
     */
    public function isLibrarian(): bool
    {
        return $this->hasRole(RoleName::Librarian->value);
    }

    /**
     * Determine whether the user is a standard library member.
     */
    public function isMember(): bool
    {
        return $this->hasRole(RoleName::Member->value);
    }

    /**
     * Get loans borrowed by this user.
     *
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'user_id');
    }

    /**
     * Get loans issued by this user (staff/librarian).
     *
     * @return HasMany<Loan, $this>
     */
    public function issuedLoans(): HasMany
    {
        return $this->hasMany(Loan::class, 'issued_by');
    }

    /**
     * Get user's favorites records.
     *
     * @return HasMany<Favorite, $this>
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class, 'user_id');
    }

    /**
     * Get books favorited by this user.
     *
     * @return BelongsToMany<Book, $this>
     */
    public function favoriteBooks(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'favorites', 'user_id', 'book_id')->withTimestamps();
    }
}
