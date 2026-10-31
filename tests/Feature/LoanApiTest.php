<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    private function authHeader(?User $user = null): array
    {
        $user ??= User::factory()->create();

        return [
            'Authorization' => 'Bearer '.$user->createToken('test_token')->plainTextToken,
        ];
    }

    private function createBookCopy(): BookCopy
    {
        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);

        return BookCopy::factory()->create([
            'book_id' => $book->id,
            'barcode' => 'BC-'.fake()->unique()->numerify('######'),
            'condition' => 'good',
        ]);
    }

    // -----------------------------------------------------------------------
    // Borrowing APIs (POST /api/v1/loans)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_borrow_a_book_copy(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $copy = $this->createBookCopy();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/loans', [
                'book_copy_id' => $copy->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'loan' => [
                    'id',
                    'user_id',
                    'book_copy_id',
                    'borrowed_at',
                    'due_at',
                    'status',
                    'user',
                    'book_copy',
                ],
            ])
            ->assertJsonPath('loan.user_id', $user->id)
            ->assertJsonPath('loan.book_copy_id', $copy->id)
            ->assertJsonPath('loan.status', 'borrowed');

        $this->assertDatabaseHas('loans', [
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
            'status' => 'borrowed',
        ]);
    }

    public function test_cannot_borrow_already_borrowed_book_copy(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $copy = $this->createBookCopy();

        // First user borrows the copy
        Loan::factory()->create([
            'user_id' => $user1->id,
            'book_copy_id' => $copy->id,
            'status' => 'borrowed',
            'returned_at' => null,
        ]);

        // Second user tries to borrow the same copy
        $response = $this->withHeaders($this->authHeader($user2))
            ->postJson('/api/v1/loans', [
                'book_copy_id' => $copy->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['book_copy_id']);
    }

    public function test_inactive_user_cannot_borrow_book(): void
    {
        $inactiveUser = User::factory()->create(['status' => 'inactive']);
        $copy = $this->createBookCopy();

        $response = $this->withHeaders($this->authHeader($inactiveUser))
            ->postJson('/api/v1/loans', [
                'book_copy_id' => $copy->id,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'User account is inactive or banned and cannot borrow books.',
            ]);
    }

    public function test_borrowing_requires_valid_book_copy_id(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/loans', [
                'book_copy_id' => 99999, // non-existent
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['book_copy_id']);
    }

    // -----------------------------------------------------------------------
    // Returning APIs (POST /api/v1/loans/{id}/return)
    // -----------------------------------------------------------------------

    public function test_user_can_return_borrowed_book_copy(): void
    {
        $user = User::factory()->create();
        $copy = $this->createBookCopy();

        $loan = Loan::factory()->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
            'status' => 'borrowed',
            'returned_at' => null,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/loans/{$loan->id}/return", [
                'condition' => 'fair',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Book returned successfully.',
            ])
            ->assertJsonPath('loan.status', 'returned');

        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'returned',
        ]);

        $this->assertEquals('fair', $copy->fresh()->condition);
    }

    public function test_book_copy_can_be_borrowed_again_after_return(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $copy = $this->createBookCopy();

        $loan = Loan::factory()->create([
            'user_id' => $user1->id,
            'book_copy_id' => $copy->id,
            'status' => 'borrowed',
            'returned_at' => null,
        ]);

        // Return the book
        $this->withHeaders($this->authHeader($user1))
            ->postJson("/api/v1/loans/{$loan->id}/return")
            ->assertStatus(200);

        // Now user2 should be able to borrow the same copy
        $response = $this->withHeaders($this->authHeader($user2))
            ->postJson('/api/v1/loans', [
                'book_copy_id' => $copy->id,
            ]);

        $response->assertStatus(201);
    }

    public function test_cannot_return_already_returned_loan(): void
    {
        $user = User::factory()->create();
        $copy = $this->createBookCopy();

        $loan = Loan::factory()->returned()->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/loans/{$loan->id}/return");

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'This book copy has already been returned.',
            ]);
    }

    public function test_returning_nonexistent_loan_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/loans/99999/return');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Loan not found']);
    }

    // -----------------------------------------------------------------------
    // Overdue APIs (GET /api/v1/loans/overdue)
    // -----------------------------------------------------------------------

    public function test_can_list_overdue_loans(): void
    {
        $user = User::factory()->create();
        $copy1 = $this->createBookCopy();
        $copy2 = $this->createBookCopy();

        // 1 overdue loan
        Loan::factory()->overdue()->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy1->id,
        ]);

        // 1 active, not yet overdue loan
        Loan::factory()->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy2->id,
            'borrowed_at' => now()->toDateString(),
            'due_at' => now()->addDays(14)->toDateString(),
            'returned_at' => null,
            'status' => 'borrowed',
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/loans/overdue');

        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.status', 'overdue');
    }

    // -----------------------------------------------------------------------
    // Loan Details and History
    // -----------------------------------------------------------------------

    public function test_can_view_loan_by_id(): void
    {
        $user = User::factory()->create();
        $copy = $this->createBookCopy();
        $loan = Loan::factory()->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy->id,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson("/api/v1/loans/{$loan->id}");

        $response->assertStatus(200)
            ->assertJsonPath('id', $loan->id);
    }

    public function test_viewing_nonexistent_loan_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/loans/99999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Loan not found']);
    }

    public function test_user_can_view_my_loans(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $copy1 = $this->createBookCopy();
        $copy2 = $this->createBookCopy();

        Loan::factory()->count(2)->create([
            'user_id' => $user->id,
            'book_copy_id' => $copy1->id,
        ]);

        Loan::factory()->count(3)->create([
            'user_id' => $otherUser->id,
            'book_copy_id' => $copy2->id,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/loans/my-loans');

        $response->assertStatus(200)
            ->assertJsonPath('total', 2);
    }
}
