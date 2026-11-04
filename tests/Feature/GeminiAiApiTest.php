<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiAiApiTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(?User $user = null): array
    {
        $user ??= User::factory()->create();

        return [
            'Authorization' => 'Bearer '.$user->createToken('test_token')->plainTextToken,
        ];
    }

    public function test_authenticated_user_can_get_ai_book_recommendations(): void
    {
        config(['services.gemini.api_key' => 'fake_gemini_key']);

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        [
                                            'title' => 'Design Patterns',
                                            'author' => 'Gang of Four',
                                            'genre' => 'Computer Science',
                                            'reason' => 'Great foundational architecture book.',
                                        ],
                                        [
                                            'title' => 'Refactoring',
                                            'author' => 'Martin Fowler',
                                            'genre' => 'Software Design',
                                            'reason' => 'Techniques for improving code quality.',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/ai/recommendations', [
                'preferences' => 'Software Engineering & Clean Architecture',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user_id',
                'based_on_history',
                'recommendations' => [
                    '*' => ['title', 'author', 'genre', 'reason'],
                ],
            ])
            ->assertJson([
                'recommendations' => [
                    [
                        'title' => 'Design Patterns',
                        'author' => 'Gang of Four',
                    ],
                ],
            ]);
    }

    public function test_user_can_summarize_book_with_gemini_ai(): void
    {
        config(['services.gemini.api_key' => 'fake_gemini_key']);

        $category = Category::factory()->create(['name' => 'Technology']);
        $book = Book::factory()->create([
            'category_id' => $category->id,
            'title' => 'Introduction to Algorithms',
            'authors' => 'CLRS',
            'description' => 'A comprehensive algorithmic foundation.',
        ]);

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'synopsis' => 'A comprehensive guide to standard algorithms and data structures.',
                                        'key_themes' => ['Algorithms', 'Complexity Analysis', 'Data Structures'],
                                        'target_audience' => 'Computer science university students and engineers',
                                        'difficulty_level' => 'Advanced',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/v1/ai/summarize/{$book->id}");

        $response->assertStatus(200)
            ->assertJson([
                'book_id' => $book->id,
                'title' => 'Introduction to Algorithms',
                'synopsis' => 'A comprehensive guide to standard algorithms and data structures.',
                'difficulty_level' => 'Advanced',
            ])
            ->assertJsonStructure([
                'book_id',
                'title',
                'synopsis',
                'key_themes',
                'target_audience',
                'difficulty_level',
            ]);
    }

    public function test_summarize_non_existent_book_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/ai/summarize/99999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Book not found']);
    }

    public function test_user_can_chat_with_library_ai_assistant(): void
    {
        config(['services.gemini.api_key' => 'fake_gemini_key']);

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => 'Hello! We have multiple books on computer science and algorithms available today. How can I assist your reading journey?',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/ai/chat', [
                'message' => 'What books do you have on algorithms?',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['reply'])
            ->assertJson([
                'reply' => 'Hello! We have multiple books on computer science and algorithms available today. How can I assist your reading journey?',
            ]);
    }

    public function test_chat_without_message_fails_validation(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/ai/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }
}
