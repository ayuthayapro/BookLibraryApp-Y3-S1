<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookApiTest extends TestCase
{
    use RefreshDatabase;

    /** Helper: create a user and return their Bearer token header. */
    private function authHeader(): array
    {
        $user = User::factory()->create();

        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/books  (index)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_list_books(): void
    {
        Book::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/books');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page', 'current_page']);
    }

    public function test_unauthenticated_user_cannot_list_books(): void
    {
        $response = $this->getJson('/api/v1/books');

        $response->assertStatus(401);
    }

    public function test_books_can_be_filtered_by_category(): void
    {
        $category = Category::factory()->create();
        Book::factory()->count(2)->create(['category_id' => $category->id]);
        Book::factory()->count(3)->create(); // different categories

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/books?category_id={$category->id}");

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('total'));
    }

    public function test_books_can_be_searched_by_title(): void
    {
        Book::factory()->create(['title' => 'Laravel for Beginners']);
        Book::factory()->create(['title' => 'Advanced PHP']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/books?search=Laravel');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
        $this->assertStringContainsString('Laravel', $response->json('data.0.title'));
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/books  (store)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_create_a_book(): void
    {
        $category = Category::factory()->create();

        $payload = [
            'title' => 'Clean Code',
            'authors' => 'Robert C. Martin',
            'category_id' => $category->id,
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/books', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment(['title' => 'Clean Code'])
            ->assertJsonStructure(['id', 'title', 'authors', 'category_id', 'category']);

        $this->assertDatabaseHas('books', ['title' => 'Clean Code']);
    }

    public function test_book_title_and_authors_are_required(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/books', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'authors', 'category_id']);
    }

    public function test_book_category_must_exist(): void
    {
        $payload = [
            'title' => 'Some Book',
            'authors' => 'Some Author',
            'category_id' => 9999, // non-existent
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/books', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_isbn_must_be_unique_when_creating_a_book(): void
    {
        $category = Category::factory()->create();
        Book::factory()->create(['isbn' => '9780132350884', 'category_id' => $category->id]);

        $payload = [
            'title' => 'Another Book',
            'authors' => 'Another Author',
            'category_id' => $category->id,
            'isbn' => '9780132350884',
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/books', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['isbn']);
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/books/{book}  (show)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_view_a_book(): void
    {
        $book = Book::factory()->create(['title' => 'Design Patterns']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/books/{$book->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'Design Patterns'])
            ->assertJsonStructure(['id', 'title', 'authors', 'category']);
    }

    public function test_viewing_a_nonexistent_book_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/books/9999');

        $response->assertStatus(404);
    }

    // -----------------------------------------------------------------------
    // PUT /api/v1/books/{book}  (update)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_update_a_book(): void
    {
        $book = Book::factory()->create(['title' => 'Old Title']);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/v1/books/{$book->id}", ['title' => 'New Title']);

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'New Title']);

        $this->assertDatabaseHas('books', ['id' => $book->id, 'title' => 'New Title']);
    }

    public function test_update_ignores_own_isbn_for_uniqueness(): void
    {
        $book = Book::factory()->create(['isbn' => '9780132350884']);

        // Updating using the same isbn should succeed
        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/v1/books/{$book->id}", ['isbn' => '9780132350884']);

        $response->assertStatus(200);
    }

    // -----------------------------------------------------------------------
    // DELETE /api/v1/books/{book}  (destroy)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_delete_a_book(): void
    {
        $book = Book::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/books/{$book->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('books', ['id' => $book->id]);
    }

    public function test_deleting_a_nonexistent_book_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->deleteJson('/api/v1/books/9999');

        $response->assertStatus(404);
    }
}
