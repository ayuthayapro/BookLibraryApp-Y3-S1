<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cs = Category::firstOrCreate(['name' => 'Computer Science']);
        $se = Category::firstOrCreate(['name' => 'Software Engineering']);
        $ai = Category::firstOrCreate(['name' => 'Artificial Intelligence']);
        $db = Category::firstOrCreate(['name' => 'Database Systems']);

        $sampleBooks = [
            [
                'category_id' => $se->id,
                'google_book_id' => 'k_0ZAAAAMAAJ',
                'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'description' => 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
                'authors' => 'Robert C. Martin',
                'isbn' => '9780132350884',
            ],
            [
                'category_id' => $se->id,
                'google_book_id' => '1MYqDwAAQBAJ',
                'title' => 'Design Patterns: Elements of Reusable Object-Oriented Software',
                'description' => 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions.',
                'authors' => 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
                'isbn' => '9780201633610',
            ],
            [
                'category_id' => $cs->id,
                'google_book_id' => 'aXZQAAAAMAAJ',
                'title' => 'Introduction to Algorithms',
                'description' => 'A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, and machine learning.',
                'authors' => 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
                'isbn' => '9780262033848',
            ],
            [
                'category_id' => $ai->id,
                'google_book_id' => '4QGkDwAAQBAJ',
                'title' => 'Artificial Intelligence: A Modern Approach',
                'description' => 'The leading textbook in Artificial Intelligence used in over 1,500 universities in 135 countries.',
                'authors' => 'Stuart Russell, Peter Norvig',
                'isbn' => '9780134610993',
            ],
            [
                'category_id' => $db->id,
                'google_book_id' => 'o0k7DwAAQBAJ',
                'title' => 'Database System Concepts',
                'description' => 'Database System Concepts presents the fundamental concepts of database management in an intuitive manner geared toward allowing students to begin working with databases as quickly as possible.',
                'authors' => 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
                'isbn' => '9780078022159',
            ],
        ];

        foreach ($sampleBooks as $book) {
            Book::firstOrCreate(['isbn' => $book['isbn']], $book);
        }
    }
}
