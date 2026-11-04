<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
        ]);

        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test Super Admin', 'status' => 'active', 'password' => 'password']
        );
        $testUser->assignRole(RoleName::Admin);

        $librarianUser = User::firstOrCreate(
            ['email' => 'librarian@example.com'],
            ['name' => 'Librarian Staff', 'status' => 'active', 'password' => 'password']
        );
        $librarianUser->assignRole(RoleName::Librarian);

        $studentUser = User::firstOrCreate(
            ['email' => 'student@example.com'],
            ['name' => 'Student Member', 'status' => 'active', 'password' => 'password']
        );
        $studentUser->assignRole(RoleName::Member);

        $this->call([
            CategorySeeder::class,
            BookSeeder::class,
            BookCopySeeder::class,
            LoanSeeder::class,
            FavoriteSeeder::class,
        ]);
    }
}
