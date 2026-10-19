<?php

namespace Database\Factories;

use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Loan>
 */
class LoanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $borrowedAt = fake()->dateTimeBetween('-1 month', 'now');
        $dueAt = (clone $borrowedAt)->modify('+14 days');

        return [
            'user_id' => User::factory(),
            'book_copy_id' => BookCopy::factory(),
            'issued_by' => User::factory(),
            'borrowed_at' => $borrowedAt->format('Y-m-d'),
            'due_at' => $dueAt->format('Y-m-d'),
            'returned_at' => null,
            'status' => 'borrowed',
        ];
    }

    /**
     * Indicate that the loan is returned.
     */
    public function returned(): static
    {
        return $this->state(fn (array $attributes) => [
            'returned_at' => now()->format('Y-m-d'),
            'status' => 'returned',
        ]);
    }

    /**
     * Indicate that the loan is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'borrowed_at' => now()->subDays(30)->format('Y-m-d'),
            'due_at' => now()->subDays(16)->format('Y-m-d'),
            'returned_at' => null,
            'status' => 'overdue',
        ]);
    }
}
