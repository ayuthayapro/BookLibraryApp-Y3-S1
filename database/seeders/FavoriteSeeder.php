<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Favorite;
use App\Models\User;
use Illuminate\Database\Seeder;

class FavoriteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $student = User::where('email', 'student@example.com')->first();
        $books = Book::take(2)->get();

        if ($student && $books->isNotEmpty()) {
            foreach ($books as $book) {
                Favorite::firstOrCreate([
                    'user_id' => $student->id,
                    'book_id' => $book->id,
                ]);
            }
        }
    }
}
