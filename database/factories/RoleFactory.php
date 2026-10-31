<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => $name,
            'display_name' => ucfirst($name),
            'description' => fake()->sentence(),
        ];
    }

    /**
     * State for admin role.
     */
    public function admin(): static
    {
        return $this->state(fn () => [
            'name' => 'admin',
            'display_name' => 'Administrator',
            'description' => 'Full administrative privileges across the application.',
        ]);
    }

    /**
     * State for librarian role.
     */
    public function librarian(): static
    {
        return $this->state(fn () => [
            'name' => 'librarian',
            'display_name' => 'Librarian',
            'description' => 'Staff permissions to manage catalog, copies, and loans.',
        ]);
    }

    /**
     * State for member role.
     */
    public function member(): static
    {
        return $this->state(fn () => [
            'name' => 'member',
            'display_name' => 'Member',
            'description' => 'Library borrower account.',
        ]);
    }
}
