<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_via_v1_endpoint(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Ayuthaya',
            'email' => 'ayuthaya@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'status'],
                'token',
                'token_type',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'ayuthaya@example.com',
            'name' => 'Ayuthaya',
            'status' => 'active',
        ]);
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/v1/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_via_v1_endpoint(): void
    {
        User::factory()->create([
            'email' => 'student@example.com',
            'password' => 'secret1234',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'student@example.com',
            'password' => 'secret1234',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
                'token_type',
            ]);
    }

    public function test_user_cannot_login_with_incorrect_password(): void
    {
        User::factory()->create([
            'email' => 'student@example.com',
            'password' => 'secret1234',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'student@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid email or password',
            ]);
    }

    public function test_authenticated_user_can_view_profile_via_v1_endpoint(): void
    {
        $user = User::factory()->create([
            'name' => 'Ayuthaya RUPP',
            'email' => 'ayuthaya@rupp.edu.kh',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => 'Ayuthaya RUPP',
                    'email' => 'ayuthaya@rupp.edu.kh',
                ],
            ]);
    }

    public function test_unauthenticated_request_to_v1_profile_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(401);
    }

    public function test_user_can_logout_via_v1_endpoint(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout_test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_legacy_routes_still_accessible_for_backward_compatibility(): void
    {
        User::factory()->create([
            'email' => 'legacy@example.com',
            'password' => 'secret1234',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'legacy@example.com',
            'password' => 'secret1234',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token']);
    }
}
