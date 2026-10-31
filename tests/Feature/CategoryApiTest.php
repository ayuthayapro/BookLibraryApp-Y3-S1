<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    /** Helper: create a user and return their Bearer token header. */
    private function authHeader(): array
    {
        $user = User::factory()->create();

        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/categories  (index)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_list_categories(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_unauthenticated_user_cannot_list_categories(): void
    {
        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(401);
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/categories  (store)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_create_a_category(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/categories', ['name' => 'Computer Science']);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Computer Science']);

        $this->assertDatabaseHas('categories', ['name' => 'Computer Science']);
    }

    public function test_category_name_is_required(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_category_name_must_be_unique(): void
    {
        Category::factory()->create(['name' => 'Fiction']);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/v1/categories', ['name' => 'Fiction']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/categories/{id}  (show)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_view_a_category(): void
    {
        $category = Category::factory()->create(['name' => 'Science']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Science']);
    }

    public function test_viewing_a_nonexistent_category_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/categories/9999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Category not found']);
    }

    // -----------------------------------------------------------------------
    // PUT /api/v1/categories/{id}  (update)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_update_a_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old Name']);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/v1/categories/{$category->id}", ['name' => 'New Name']);

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'New Name']);

        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'New Name']);
    }

    public function test_update_ignores_own_name_for_uniqueness(): void
    {
        $category = Category::factory()->create(['name' => 'Math']);

        // Updating to the same name should succeed (not fail uniqueness)
        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/v1/categories/{$category->id}", ['name' => 'Math']);

        $response->assertStatus(200);
    }

    public function test_updating_a_nonexistent_category_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->putJson('/api/v1/categories/9999', ['name' => 'Non Existent']);

        $response->assertStatus(404)
            ->assertJson(['message' => 'Category not found']);
    }

    // -----------------------------------------------------------------------
    // DELETE /api/v1/categories/{id}  (destroy)
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_delete_an_empty_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_deleting_a_nonexistent_category_returns_404(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->deleteJson('/api/v1/categories/9999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Category not found']);
    }

    public function test_cannot_delete_a_category_that_has_books(): void
    {
        $category = Category::factory()->create();
        Book::factory()->create(['category_id' => $category->id]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(409)
            ->assertJsonFragment(['message' => 'Cannot delete a category that still has books.']);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
