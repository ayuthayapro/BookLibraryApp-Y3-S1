<?php

namespace Database\Seeders;

use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;

class LoanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $librarian = User::firstOrCreate(
            ['email' => 'librarian@example.com'],
            [
                'name' => 'Head Librarian',
                'password' => 'password',
                'status' => 'active',
            ]
        );

        $member = User::firstOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Alice Student',
                'password' => 'password',
                'status' => 'active',
            ]
        );

        $copies = BookCopy::take(3)->get();

        if ($copies->count() >= 3) {
            // 1 active loan
            Loan::firstOrCreate(
                [
                    'user_id' => $member->id,
                    'book_copy_id' => $copies[0]->id,
                ],
                [
                    'issued_by' => $librarian->id,
                    'borrowed_at' => now()->subDays(3)->format('Y-m-d'),
                    'due_at' => now()->addDays(11)->format('Y-m-d'),
                    'returned_at' => null,
                    'status' => 'borrowed',
                ]
            );

            // 1 returned loan
            Loan::firstOrCreate(
                [
                    'user_id' => $member->id,
                    'book_copy_id' => $copies[1]->id,
                ],
                [
                    'issued_by' => $librarian->id,
                    'borrowed_at' => now()->subDays(20)->format('Y-m-d'),
                    'due_at' => now()->subDays(6)->format('Y-m-d'),
                    'returned_at' => now()->subDays(7)->format('Y-m-d'),
                    'status' => 'returned',
                ]
            );

            // 1 overdue loan
            Loan::firstOrCreate(
                [
                    'user_id' => $member->id,
                    'book_copy_id' => $copies[2]->id,
                ],
                [
                    'issued_by' => $librarian->id,
                    'borrowed_at' => now()->subDays(25)->format('Y-m-d'),
                    'due_at' => now()->subDays(11)->format('Y-m-d'),
                    'returned_at' => null,
                    'status' => 'overdue',
                ]
            );
        }
    }
}
