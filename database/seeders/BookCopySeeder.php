<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Database\Seeder;

class BookCopySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $books = Book::all();

        foreach ($books as $book) {
            // Ensure 3 copies per book
            for ($i = 1; $i <= 3; $i++) {
                $barcode = sprintf('BC-%04d-%02d', $book->id, $i);
                BookCopy::firstOrCreate(
                    ['barcode' => $barcode],
                    [
                        'book_id' => $book->id,
                        'condition' => $i === 3 ? 'fair' : 'good',
                    ]
                );
            }
        }
    }
}
