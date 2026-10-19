<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'google_book_id' => fake()->regexify('[A-Za-z0-9_-]{12}'),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'authors' => fake()->name(),
            'isbn' => fake()->isbn13(),
        ];
    }
}
