<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookCopyApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper to return an authorization header for an authenticated user.
     *
     * @return array<string, string>
     */
    private function authHeader(?User $user = null): array
    {
        $user ??= User::factory()->create();

        return [
            'Authorization' => 'Bearer '.$user->createToken('test_token')->plainTextToken,
        ];
    }

    // -----------------------------------------------------------------------
    // List & Filtering Book Copies (GET /api/v1/book-copies)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_list_book_copies(): void
    {
        $book = Book::factory()->create();
        BookCopy::factory()->count(3)->create(['book_id' => $book->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'book_id', 'barcode', 'condition', 'is_available', 'status', 'book'],
                ],
                'total',
                'current_page',
            ]);
    }

    public function test_unauthenticated_user_cannot_access_book_copies(): void
    {
        $response = $this->getJson('/api/v1/book-copies');

        $response->assertStatus(401);
    }

    public function test_book_copies_can_be_filtered_by_book_id(): void
    {
        $book1 = Book::factory()->create();
        $book2 = Book::factory()->create();

        BookCopy::factory()->count(2)->create(['book_id' => $book1->id]);
        BookCopy::factory()->count(3)->create(['book_id' => $book2->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/book-copies?book_id={$book1->id}");

        $response->assertStatus(200);
        $this->assertSame(2, $response->json('total'));
    }

    public function test_book_copies_can_be_filtered_by_status_available_and_borrowed(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create();

        $availableCopy = BookCopy::factory()->create(['book_id' => $book->id]);
        $borrowedCopy = BookCopy::factory()->create(['book_id' => $book->id]);

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $borrowedCopy->id,
            'borrowed_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'status' => 'borrowed',
        ]);

        $availableResponse = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies?status=available');
        $availableResponse->assertStatus(200);
        $this->assertSame(1, $availableResponse->json('total'));
        $this->assertSame($availableCopy->id, $availableResponse->json('data.0.id'));

        $borrowedResponse = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies?status=borrowed');
        $borrowedResponse->assertStatus(200);
        $this->assertSame(1, $borrowedResponse->json('total'));
        $this->assertSame($borrowedCopy->id, $borrowedResponse->json('data.0.id'));
    }

    public function test_book_copies_can_be_filtered_by_condition(): void
    {
        $book = Book::factory()->create();
        BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'damaged']);
        BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'new']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies?condition=damaged');

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('total'));
        $this->assertSame('damaged', $response->json('data.0.condition'));
    }

    public function test_book_copies_can_be_searched_by_barcode_or_book_title(): void
    {
        $book = Book::factory()->create(['title' => 'Advanced Algorithms']);
        BookCopy::factory()->create([
            'book_id' => $book->id,
            'barcode' => 'ALG-99998888',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies?search=ALG-9999');

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('total'));

        $titleSearch = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies?search=Algorithms');

        $titleSearch->assertStatus(200);
        $this->assertSame(1, $titleSearch->json('total'));
    }

    // -----------------------------------------------------------------------
    // Create Copy APIs (POST /api/v1/book-copies)
    // -----------------------------------------------------------------------

    public function test_user_can_create_a_book_copy_with_custom_barcode(): void
    {
        $book = Book::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/book-copies', [
                'book_id' => $book->id,
                'barcode' => 'CUSTOM-BARCODE-001',
                'condition' => 'new',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'book_id' => $book->id,
                'barcode' => 'CUSTOM-BARCODE-001',
                'condition' => 'new',
                'is_available' => true,
                'status' => 'available',
            ]);

        $this->assertDatabaseHas('book_copies', [
            'barcode' => 'CUSTOM-BARCODE-001',
        ]);
    }

    public function test_user_can_create_a_book_copy_with_auto_generated_barcode(): void
    {
        $book = Book::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/book-copies', [
                'book_id' => $book->id,
                'condition' => 'good',
            ]);

        $response->assertStatus(201);
        $barcode = $response->json('barcode');
        $this->assertNotEmpty($barcode);
        $this->assertStringStartsWith('LIB-', $barcode);

        $this->assertDatabaseHas('book_copies', [
            'id' => $response->json('id'),
            'barcode' => $barcode,
        ]);
    }

    public function test_duplicate_barcode_fails_validation(): void
    {
        $book = Book::factory()->create();
        BookCopy::factory()->create(['barcode' => 'DUP-12345']);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/book-copies', [
                'book_id' => $book->id,
                'barcode' => 'DUP-12345',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['barcode']);
    }

    public function test_user_can_bulk_create_book_copies(): void
    {
        $book = Book::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/book-copies/bulk', [
                'book_id' => $book->id,
                'count' => 4,
                'condition' => 'new',
                'prefix' => 'FAC',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'count' => 4,
            ]);

        $this->assertCount(4, $response->json('copies'));
        $this->assertDatabaseCount('book_copies', 4);

        foreach ($response->json('copies') as $copy) {
            $this->assertStringStartsWith('FAC-', $copy['barcode']);
        }
    }

    public function test_user_can_create_copies_via_book_endpoint(): void
    {
        $book = Book::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/v1/books/{$book->id}/copies", [
                'count' => 3,
                'condition' => 'fair',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'count' => 3,
            ]);

        $this->assertDatabaseCount('book_copies', 3);
    }

    // -----------------------------------------------------------------------
    // Show Copy & Barcode Lookup (GET /api/v1/book-copies/{id} & barcode)
    // -----------------------------------------------------------------------

    public function test_user_can_show_copy_by_id(): void
    {
        $book = Book::factory()->create();
        $copy = BookCopy::factory()->create(['book_id' => $book->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/book-copies/{$copy->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $copy->id,
                'barcode' => $copy->barcode,
                'is_available' => true,
                'status' => 'available',
            ]);
    }

    public function test_show_non_existent_copy_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies/99999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Book copy not found']);
    }

    public function test_user_can_show_copy_by_barcode(): void
    {
        $book = Book::factory()->create();
        $copy = BookCopy::factory()->create([
            'book_id' => $book->id,
            'barcode' => 'SCAN-12345678',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies/barcode/SCAN-12345678');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $copy->id,
                'barcode' => 'SCAN-12345678',
            ]);
    }

    public function test_show_by_non_existent_barcode_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/book-copies/barcode/NONEXISTENT-CODE');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Book copy not found']);
    }

    public function test_user_can_fetch_barcode_label_payload(): void
    {
        $book = Book::factory()->create(['title' => 'Design Patterns']);
        $copy = BookCopy::factory()->create([
            'book_id' => $book->id,
            'barcode' => 'DP-100200',
            'condition' => 'good',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/book-copies/{$copy->id}/barcode");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'barcode',
                'format',
                'book_id',
                'book_title',
                'condition',
                'status',
                'is_available',
                'printable_label' => ['title', 'barcode', 'condition', 'call_number'],
            ])
            ->assertJson([
                'barcode' => 'DP-100200',
                'book_title' => 'Design Patterns',
            ]);
    }

    // -----------------------------------------------------------------------
    // Update Copy (PUT /api/v1/book-copies/{id})
    // -----------------------------------------------------------------------

    public function test_user_can_update_book_copy(): void
    {
        $book = Book::factory()->create();
        $copy = BookCopy::factory()->create([
            'book_id' => $book->id,
            'barcode' => 'OLD-BC-123',
            'condition' => 'fair',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/v1/book-copies/{$copy->id}", [
                'barcode' => 'NEW-BC-456',
                'condition' => 'damaged',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'barcode' => 'NEW-BC-456',
                'condition' => 'damaged',
            ]);

        $this->assertDatabaseHas('book_copies', [
            'id' => $copy->id,
            'barcode' => 'NEW-BC-456',
            'condition' => 'damaged',
        ]);
    }

    // -----------------------------------------------------------------------
    // Delete Copy (DELETE /api/v1/book-copies/{id})
    // -----------------------------------------------------------------------

    public function test_user_can_delete_unused_book_copy(): void
    {
        $copy = BookCopy::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/book-copies/{$copy->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('book_copies', ['id' => $copy->id]);
    }

    public function test_cannot_delete_book_copy_currently_borrowed(): void
    {
        $user = User::factory()->create();
        $copy = BookCopy::factory()->create();

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
            'borrowed_at' => now()->toDateString(),
            'due_at' => now()->addDays(14)->toDateString(),
            'status' => 'borrowed',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/book-copies/{$copy->id}");

        $response->assertStatus(409)
            ->assertJson(['message' => 'Cannot delete copy that is currently borrowed.']);

        $this->assertDatabaseHas('book_copies', ['id' => $copy->id]);
    }

    public function test_cannot_delete_book_copy_with_past_loan_history(): void
    {
        $user = User::factory()->create();
        $copy = BookCopy::factory()->create();

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
            'borrowed_at' => now()->subMonth()->toDateString(),
            'due_at' => now()->subWeeks(2)->toDateString(),
            'returned_at' => now()->subWeeks(2)->toDateString(),
            'status' => 'returned',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/book-copies/{$copy->id}");

        $response->assertStatus(409)
            ->assertJson(['message' => 'Cannot delete copy that has loan history.']);

        $this->assertDatabaseHas('book_copies', ['id' => $copy->id]);
    }

    // -----------------------------------------------------------------------
    // Inventory APIs (GET /api/v1/inventory, summary, book)
    // -----------------------------------------------------------------------

    public function test_inventory_summary_endpoint(): void
    {
        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);
        $copy1 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'new']);
        $copy2 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'good']);

        $user = User::factory()->create();
        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy1->id,
            'borrowed_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'status' => 'borrowed',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/inventory/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_books',
                'total_copies',
                'available_copies',
                'borrowed_copies',
                'overdue_copies',
                'condition_breakdown',
            ])
            ->assertJson([
                'total_books' => 1,
                'total_copies' => 2,
                'available_copies' => 1,
                'borrowed_copies' => 1,
            ]);
    }

    public function test_inventory_index_endpoint(): void
    {
        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);
        BookCopy::factory()->count(3)->create(['book_id' => $book->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/inventory');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'total_books',
                    'total_copies',
                    'available_copies',
                    'borrowed_copies',
                ],
                'books' => [
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'total_copies',
                            'available_copies',
                            'borrowed_copies',
                            'category',
                        ],
                    ],
                ],
            ]);
    }

    public function test_book_specific_inventory_endpoint(): void
    {
        $book = Book::factory()->create();
        $copy1 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'good']);
        $copy2 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'good']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/books/{$book->id}/inventory");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'book' => ['id', 'title', 'isbn'],
                'inventory' => [
                    'total_copies',
                    'available_copies',
                    'borrowed_copies',
                    'condition_breakdown',
                ],
                'copies',
            ])
            ->assertJson([
                'inventory' => [
                    'total_copies' => 2,
                    'available_copies' => 2,
                    'borrowed_copies' => 0,
                ],
            ]);

        // Also test the alias endpoint /inventory/books/{id}
        $aliasResponse = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/inventory/books/{$book->id}");
        $aliasResponse->assertStatus(200);
    }

    public function test_inventory_for_non_existent_book_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/books/999999/inventory');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Book not found']);
    }
}
