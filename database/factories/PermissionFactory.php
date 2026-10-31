<?php

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Permission>
 */
class PermissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word().'.'.fake()->word();

        return [
            'name' => $name,
            'display_name' => ucwords(str_replace('.', ' ', $name)),
            'description' => fake()->sentence(),
        ];
    }
}
