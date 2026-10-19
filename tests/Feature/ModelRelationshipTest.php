<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Favorite;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_has_many_books(): void
    {
        $category = Category::factory()->create();
        $books = Book::factory()->count(3)->create(['category_id' => $category->id]);

        $this->assertCount(3, $category->books);
        $this->assertTrue($category->books->first()->is($books->first()));
        $this->assertTrue($books->first()->category->is($category));
    }

    public function test_book_has_copies_and_aliases(): void
    {
        $book = Book::factory()->create([
            'google_book_id' => 'G12345',
            'description' => 'Test description',
        ]);

        $copy1 = BookCopy::factory()->create(['book_id' => $book->id, 'barcode' => 'BC-1111']);
        $copy2 = BookCopy::factory()->create(['book_id' => $book->id, 'barcode' => 'BC-2222']);

        $this->assertCount(2, $book->bookCopies);
        $this->assertCount(2, $book->copies);
        $this->assertTrue($copy1->book->is($book));

        // Test aliases
        $this->assertSame('G12345', $book->google_id);
        $this->assertSame('Test description', $book->desciption);
    }

    public function test_user_loans_and_borrowing_relationships(): void
    {
        $borrower = User::factory()->create(['name' => 'Borrower']);
        $librarian = User::factory()->create(['name' => 'Librarian']);
        $book = Book::factory()->create();
        $copy = BookCopy::factory()->create(['book_id' => $book->id]);

        $loan = Loan::factory()->create([
            'user_id' => $borrower->id,
            'book_copy_id' => $copy->id,
            'issued_by' => $librarian->id,
            'borrowed_at' => '2026-10-15',
            'due_at' => '2026-10-29',
            'status' => 'borrowed',
        ]);

        // Relationships from Loan
        $this->assertTrue($loan->user->is($borrower));
        $this->assertTrue($loan->borrower->is($borrower));
        $this->assertTrue($loan->bookCopy->is($copy));
        $this->assertTrue($loan->issuedBy->is($librarian));
        $this->assertTrue($loan->issuer->is($librarian));

        // Relationships from User
        $this->assertCount(1, $borrower->loans);
        $this->assertTrue($borrower->loans->first()->is($loan));
        $this->assertCount(1, $librarian->issuedLoans);
        $this->assertTrue($librarian->issuedLoans->first()->is($loan));

        // HasManyThrough from Book to Loans
        $this->assertCount(1, $book->loans);
        $this->assertTrue($book->loans->first()->is($loan));

        // Alias for borrowed_id
        $this->assertSame('2026-10-15', $loan->borrowed_id);
    }

    public function test_favorites_relationships(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create();

        $favorite = Favorite::factory()->create([
            'user_id' => $user->id,
            'book_id' => $book->id,
        ]);

        $this->assertTrue($favorite->user->is($user));
        $this->assertTrue($favorite->book->is($book));

        $this->assertCount(1, $user->favorites);
        $this->assertCount(1, $user->favoriteBooks);
        $this->assertTrue($user->favoriteBooks->first()->is($book));

        $this->assertCount(1, $book->favorites);
        $this->assertCount(1, $book->favoritedByUsers);
        $this->assertTrue($book->favoritedByUsers->first()->is($user));
    }

    public function test_user_has_api_tokens_ability(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token');

        $this->assertNotNull($token->plainTextToken);
        $this->assertCount(1, $user->tokens);
        $this->assertSame('test-token', $user->tokens->first()->name);
    }
}
