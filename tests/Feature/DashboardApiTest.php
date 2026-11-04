<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(?User $user = null): array
    {
        $user ??= User::factory()->create();

        return [
            'Authorization' => 'Bearer '.$user->createToken('test_token')->plainTextToken,
        ];
    }

    public function test_authenticated_user_can_view_dashboard_stats(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create(['name' => 'Databases']);
        $book = Book::factory()->create(['category_id' => $category->id]);
        $copy1 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'new']);
        $copy2 = BookCopy::factory()->create(['book_id' => $book->id, 'condition' => 'good']);

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy1->id,
            'borrowed_at' => now()->subDays(5)->toDateString(),
            'due_at' => now()->addDays(5)->toDateString(),
            'status' => 'borrowed',
        ]);

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy2->id,
            'borrowed_at' => now()->subDays(20)->toDateString(),
            'due_at' => now()->subDays(5)->toDateString(),
            'returned_at' => now()->subDays(5)->toDateString(),
            'status' => 'returned',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'total_books',
                    'total_copies',
                    'available_copies',
                    'borrowed_copies',
                    'total_users',
                    'active_borrowers',
                    'total_loans',
                    'active_loans',
                    'overdue_loans',
                    'returned_loans',
                    'return_rate_percentage',
                ],
                'breakdowns' => [
                    'copies_by_condition',
                    'loans_by_status',
                    'top_categories',
                ],
            ])
            ->assertJson([
                'summary' => [
                    'total_books' => 1,
                    'total_copies' => 2,
                    'available_copies' => 1,
                    'borrowed_copies' => 1,
                    'total_loans' => 2,
                    'active_loans' => 1,
                    'returned_loans' => 1,
                    'return_rate_percentage' => 50.0,
                ],
            ]);
    }

    public function test_user_can_view_popular_books(): void
    {
        $book1 = Book::factory()->create(['title' => 'Most Popular']);
        $book2 = Book::factory()->create(['title' => 'Less Popular']);

        $copy1 = BookCopy::factory()->create(['book_id' => $book1->id]);
        $copy2 = BookCopy::factory()->create(['book_id' => $book2->id]);
        $user = User::factory()->create();

        // 2 loans for book1
        Loan::factory()->count(2)->create(['book_copy_id' => $copy1->id, 'user_id' => $user->id]);
        // 1 loan for book2
        Loan::factory()->create(['book_copy_id' => $copy2->id, 'user_id' => $user->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/dashboard/popular-books');

        $response->assertStatus(200)
            ->assertJsonStructure(['popular_books'])
            ->assertJson([
                'popular_books' => [
                    ['id' => $book1->id, 'loans_count' => 2],
                    ['id' => $book2->id, 'loans_count' => 1],
                ],
            ]);
    }

    public function test_user_can_view_recent_activities(): void
    {
        $user = User::factory()->create(['name' => 'Alice']);
        $copy = BookCopy::factory()->create();

        Loan::create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
            'borrowed_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'status' => 'borrowed',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/dashboard/recent-activities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'recent_activities' => [
                    '*' => ['id', 'user', 'user_email', 'book_title', 'barcode', 'status', 'borrowed_at'],
                ],
            ])
            ->assertJson([
                'recent_activities' => [
                    [
                        'user' => 'Alice',
                        'status' => 'borrowed',
                    ],
                ],
            ]);
    }

    public function test_user_can_view_circulation_charts(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/dashboard/charts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'daily_circulation_trend' => [
                    '*' => ['date', 'borrowed', 'returned'],
                ],
            ]);

        $this->assertCount(14, $response->json('daily_circulation_trend'));
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $response = $this->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(401);
    }
}
