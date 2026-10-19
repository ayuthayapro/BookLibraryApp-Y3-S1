<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Computer Science',
            'Software Engineering',
            'Artificial Intelligence',
            'Database Systems',
            'Fiction',
            'Science & Technology',
            'Mathematics',
            'History',
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['name' => $category]);
        }
    }
}
