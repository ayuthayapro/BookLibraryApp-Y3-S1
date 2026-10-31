<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Category permissions
            'categories.view' => 'View categories',
            'categories.create' => 'Create new categories',
            'categories.update' => 'Update categories',
            'categories.delete' => 'Delete categories',

            // Book permissions
            'books.view' => 'View books catalog',
            'books.create' => 'Create new books',
            'books.update' => 'Update books',
            'books.delete' => 'Delete books',

            // Book copy permissions
            'book-copies.view' => 'View physical copies',
            'book-copies.create' => 'Create physical copies',
            'book-copies.update' => 'Update physical copies',
            'book-copies.delete' => 'Delete physical copies',

            // Loan permissions
            'loans.view-any' => 'View all loans across users',
            'loans.view-own' => 'View own borrowing history',
            'loans.create' => 'Issue new loans',
            'loans.return' => 'Mark loans as returned',
            'loans.update' => 'Update loan records',

            // User management permissions
            'users.view' => 'View registered users',
            'users.create' => 'Create new users',
            'users.update' => 'Update user details',
            'users.delete' => 'Delete users',

            // Role and permission management
            'roles.manage' => 'Manage roles and system permissions',
        ];

        $permissionModels = [];
        foreach ($permissions as $name => $displayName) {
            $permissionModels[$name] = Permission::firstOrCreate(
                ['name' => $name],
                ['display_name' => $displayName, 'description' => $displayName]
            );
        }

        // 1. Admin Role (Superuser)
        $adminRole = Role::firstOrCreate(
            ['name' => RoleName::Admin->value],
            [
                'display_name' => 'Administrator',
                'description' => 'Full administrative access across all library modules.',
            ]
        );
        $adminRole->syncPermissions(array_keys($permissions));

        // 2. Librarian Role (Staff)
        $librarianRole = Role::firstOrCreate(
            ['name' => RoleName::Librarian->value],
            [
                'display_name' => 'Librarian',
                'description' => 'Staff permissions to manage books, copies, and loan circulation.',
            ]
        );
        $librarianPermissions = [
            'categories.view',
            'categories.create',
            'categories.update',
            'books.view',
            'books.create',
            'books.update',
            'book-copies.view',
            'book-copies.create',
            'book-copies.update',
            'loans.view-any',
            'loans.create',
            'loans.return',
            'loans.update',
            'users.view',
        ];
        $librarianRole->syncPermissions($librarianPermissions);

        // 3. Member Role (Student / Borrower)
        $memberRole = Role::firstOrCreate(
            ['name' => RoleName::Member->value],
            [
                'display_name' => 'Member',
                'description' => 'Student or library member with browsing and borrowing access.',
            ]
        );
        $memberPermissions = [
            'categories.view',
            'books.view',
            'book-copies.view',
            'loans.view-own',
        ];
        $memberRole->syncPermissions($memberPermissions);

        // Assign admin role to test user if exists
        $testUser = User::where('email', 'test@example.com')->first();
        if ($testUser) {
            $testUser->assignRole(RoleName::Admin);
        }
    }
}
