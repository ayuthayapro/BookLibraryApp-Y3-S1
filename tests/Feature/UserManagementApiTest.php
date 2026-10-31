<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_users_with_pagination(): void
    {
        $admin = User::factory()->create();
        User::factory()->count(15)->create();

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/users?per_page=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data' => [
                    '*' => ['id', 'name', 'email', 'status', 'loans_count'],
                ],
                'total',
                'per_page',
            ]);

        $this->assertEquals(5, count($response->json('data')));
    }

    public function test_user_can_search_by_name_or_email(): void
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create([
            'name' => 'Sokha Rith',
            'email' => 'sokha@library.kh',
        ]);
        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/users?search=sokha');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Sokha Rith', $data[0]['name']);
    }

    public function test_authenticated_user_can_view_single_user_with_loans(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create(['name' => 'Dara Student']);

        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);
        $copy = BookCopy::factory()->create(['book_id' => $book->id]);

        Loan::factory()->create([
            'user_id' => $member->id,
            'book_copy_id' => $copy->id,
            'issued_by' => $admin->id,
            'status' => 'borrowed',
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/users/'.$member->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'loans' => [
                        '*' => [
                            'id',
                            'status',
                            'book_copy' => [
                                'id',
                                'book' => ['id', 'title'],
                            ],
                        ],
                    ],
                ],
            ]);

        $this->assertEquals('Dara Student', $response->json('user.name'));
        $this->assertCount(1, $response->json('user.loans'));
    }

    public function test_user_can_update_profile_and_status(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create([
            'name' => 'Old Name',
            'status' => 'active',
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/v1/users/'.$member->id, [
                'name' => 'Updated Name',
                'status' => 'banned',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $member->id,
                    'name' => 'Updated Name',
                    'status' => 'banned',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'name' => 'Updated Name',
            'status' => 'banned',
        ]);
    }

    public function test_cannot_delete_self_account(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/v1/users/'.$admin->id);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'You cannot delete your own account.',
            ]);
    }

    public function test_cannot_delete_user_with_active_borrowed_books(): void
    {
        $admin = User::factory()->create();
        $borrower = User::factory()->create();

        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);
        $copy = BookCopy::factory()->create(['book_id' => $book->id]);

        Loan::factory()->create([
            'user_id' => $borrower->id,
            'book_copy_id' => $copy->id,
            'issued_by' => $admin->id,
            'status' => 'borrowed',
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/v1/users/'.$borrower->id);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Cannot delete user with active borrowed books. All books must be returned first.',
            ]);

        $this->assertDatabaseHas('users', ['id' => $borrower->id]);
    }

    public function test_can_delete_user_without_active_loans(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/v1/users/'.$member->id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User deleted successfully',
            ]);

        $this->assertDatabaseMissing('users', ['id' => $member->id]);
    }
}
