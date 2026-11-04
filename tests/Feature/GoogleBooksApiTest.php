<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleBooksApiTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(?User $user = null): array
    {
        $user ??= User::factory()->create();

        return [
            'Authorization' => 'Bearer '.$user->createToken('test_token')->plainTextToken,
        ];
    }

    public function test_authenticated_user_can_search_books_on_google(): void
    {
        Http::fake([
            'https://www.googleapis.com/books/v1/volumes*' => Http::response([
                'totalItems' => 1,
                'items' => [
                    [
                        'id' => 'abc123xyz',
                        'volumeInfo' => [
                            'title' => 'Refactoring',
                            'authors' => ['Martin Fowler'],
                            'description' => 'Improving the Design of Existing Code.',
                            'categories' => ['Computers'],
                            'industryIdentifiers' => [
                                ['type' => 'ISBN_13', 'identifier' => '9780134757599'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/google-books/search?q=Refactoring');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_items',
                'items' => [
                    '*' => ['google_book_id', 'title', 'authors', 'description', 'isbn', 'categories'],
                ],
            ])
            ->assertJson([
                'total_items' => 1,
                'items' => [
                    [
                        'google_book_id' => 'abc123xyz',
                        'title' => 'Refactoring',
                        'authors' => 'Martin Fowler',
                        'isbn' => '9780134757599',
                    ],
                ],
            ]);
    }

    public function test_search_without_query_fails_validation(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/google-books/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_user_can_view_single_google_volume(): void
    {
        Http::fake([
            'https://www.googleapis.com/books/v1/volumes/test_volume_id*' => Http::response([
                'id' => 'test_volume_id',
                'volumeInfo' => [
                    'title' => 'Clean Architecture',
                    'authors' => ['Robert C. Martin'],
                    'description' => 'A Craftsman Guide to Software Structure.',
                    'categories' => ['Software Engineering'],
                    'industryIdentifiers' => [
                        ['type' => 'ISBN_13', 'identifier' => '9780134494166'],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/google-books/test_volume_id');

        $response->assertStatus(200)
            ->assertJson([
                'google_book_id' => 'test_volume_id',
                'title' => 'Clean Architecture',
                'authors' => 'Robert C. Martin',
                'isbn' => '9780134494166',
            ]);
    }

    public function test_non_existent_google_volume_returns_404(): void
    {
        Http::fake([
            'https://www.googleapis.com/books/v1/volumes/non_existent*' => Http::response([], 404),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/google-books/non_existent');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Google Books volume not found']);
    }

    public function test_user_can_import_book_from_google_books(): void
    {
        Http::fake([
            'https://www.googleapis.com/books/v1/volumes/google_vol_123*' => Http::response([
                'id' => 'google_vol_123',
                'volumeInfo' => [
                    'title' => 'Domain-Driven Design',
                    'authors' => ['Eric Evans'],
                    'description' => 'Tackling Complexity in the Heart of Software.',
                    'categories' => ['Computer Science'],
                    'industryIdentifiers' => [
                        ['type' => 'ISBN_13', 'identifier' => '9780321125217'],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/google-books/import', [
                'google_book_id' => 'google_vol_123',
                'copies_count' => 3,
                'condition' => 'new',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Book imported successfully from Google Books.',
                'book' => [
                    'google_book_id' => 'google_vol_123',
                    'title' => 'Domain-Driven Design',
                    'authors' => 'Eric Evans',
                    'isbn' => '9780321125217',
                ],
            ]);

        $this->assertDatabaseHas('books', [
            'google_book_id' => 'google_vol_123',
            'title' => 'Domain-Driven Design',
            'isbn' => '9780321125217',
        ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'Computer Science',
        ]);

        $this->assertDatabaseCount('book_copies', 3);
    }

    public function test_import_with_explicit_category(): void
    {
        $customCategory = Category::factory()->create(['name' => 'Architecture']);

        Http::fake([
            'https://www.googleapis.com/books/v1/volumes/google_vol_456*' => Http::response([
                'id' => 'google_vol_456',
                'volumeInfo' => [
                    'title' => 'Building Microservices',
                    'authors' => ['Sam Newman'],
                    'categories' => ['General Technology'],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/google-books/import', [
                'google_book_id' => 'google_vol_456',
                'category_id' => $customCategory->id,
                'copies_count' => 1,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'book' => [
                    'category_id' => $customCategory->id,
                ],
            ]);

        $this->assertDatabaseHas('books', [
            'google_book_id' => 'google_vol_456',
            'category_id' => $customCategory->id,
        ]);
    }
}

