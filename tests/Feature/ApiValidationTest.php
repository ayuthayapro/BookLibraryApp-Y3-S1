<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    private function getAdminHeader(): array
    {
        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);

        return ['Authorization' => 'Bearer '.$admin->createToken('admin_test')->plainTextToken];
    }

    public function test_register_validation_rejects_missing_and_invalid_data(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_validation_rejects_empty_credentials(): void
    {
        $response = $this->postJson('/api/v1/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_category_validation_requires_unique_name(): void
    {
        Category::factory()->create(['name' => 'Technology']);

        $response = $this->withHeaders($this->getAdminHeader())
            ->postJson('/api/v1/categories', ['name' => 'Technology']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_book_validation_requires_mandatory_fields_and_valid_category(): void
    {
        $response = $this->withHeaders($this->getAdminHeader())
            ->postJson('/api/v1/books', [
                'category_id' => 999999, // does not exist
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'authors', 'category_id']);
    }

    public function test_book_validation_enforces_unique_isbn_and_google_id(): void
    {
        $category = Category::factory()->create();
        Book::factory()->create([
            'category_id' => $category->id,
            'isbn' => '978-0132350884',
            'google_book_id' => 'G123456',
        ]);

        $response = $this->withHeaders($this->getAdminHeader())
            ->postJson('/api/v1/books', [
                'category_id' => $category->id,
                'title' => 'Another Book',
                'authors' => 'Author Name',
                'isbn' => '978-0132350884',
                'google_id' => 'G123456',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['isbn', 'google_id']);
    }

    public function test_store_role_validation_enforces_alpha_dash_and_existing_permissions(): void
    {
        $response = $this->withHeaders($this->getAdminHeader())
            ->postJson('/api/v1/roles', [
                'name' => 'invalid role name with spaces!',
                'permissions' => ['non.existent.permission'],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'permissions.0']);
    }

    public function test_assign_role_validation_requires_valid_roles_array(): void
    {
        $targetUser = User::factory()->create();

        $response = $this->withHeaders($this->getAdminHeader())
            ->postJson("/api/v1/users/{$targetUser->id}/roles", [
                'roles' => ['completely_fake_role'],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['roles.0']);
    }

    public function test_update_user_validation_validates_status_and_duplicate_email(): void
    {
        $user1 = User::factory()->create(['email' => 'first@library.kh']);
        $user2 = User::factory()->create(['email' => 'second@library.kh']);

        $response = $this->withHeaders($this->getAdminHeader())
            ->putJson("/api/v1/users/{$user2->id}", [
                'email' => 'first@library.kh', // duplicate
                'status' => 'invalid_status_value',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'status']);
    }
}
