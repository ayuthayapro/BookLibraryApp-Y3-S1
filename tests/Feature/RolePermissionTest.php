<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_user_can_be_assigned_and_checked_for_roles(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->hasRole(RoleName::Admin));

        $user->assignRole(RoleName::Admin);
        $this->assertTrue($user->hasRole(RoleName::Admin));
        $this->assertTrue($user->isAdmin());

        $user->removeRole(RoleName::Admin);
        $this->assertFalse($user->hasRole(RoleName::Admin));

        $user->syncRoles([RoleName::Librarian->value, RoleName::Member->value]);
        $this->assertTrue($user->hasRole(RoleName::Librarian));
        $this->assertTrue($user->hasRole(RoleName::Member));
        $this->assertTrue($user->hasAllRoles(['librarian', 'member']));
    }

    public function test_user_permissions_and_admin_bypass(): void
    {
        $member = User::factory()->create();
        $member->assignRole(RoleName::Member);

        $this->assertTrue($member->hasPermissionTo('books.view'));
        $this->assertFalse($member->hasPermissionTo('books.delete'));

        // Direct permission grant
        $member->givePermissionTo('books.delete');
        $this->assertTrue($member->hasPermissionTo('books.delete'));

        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);

        // Admin automatically has access to any permission
        $this->assertTrue($admin->hasPermissionTo('any.random.permission'));
        $this->assertTrue($admin->isAdmin());
    }

    public function test_admin_can_access_roles_and_permissions_endpoints(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'roles' => [
                    '*' => ['id', 'name', 'display_name', 'permissions'],
                ],
            ]);

        $permResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/permissions');

        $permResponse->assertStatus(200)
            ->assertJsonStructure([
                'permissions' => [
                    '*' => ['id', 'name', 'display_name'],
                ],
            ]);
    }

    public function test_non_admin_cannot_access_roles_endpoints(): void
    {
        $member = User::factory()->create();
        $member->assignRole(RoleName::Member);
        $token = $member->createToken('member_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/roles');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: You do not have the required role to access this resource.',
            ]);
    }

    public function test_admin_can_create_custom_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/roles', [
                'name' => 'editor',
                'display_name' => 'Content Editor',
                'description' => 'Can edit books and categories',
                'permissions' => ['books.update', 'categories.update'],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('role.name', 'editor')
            ->assertJsonCount(2, 'role.permissions');

        $this->assertDatabaseHas('roles', ['name' => 'editor']);
    }

    public function test_admin_can_assign_roles_to_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);
        $targetUser = User::factory()->create();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/v1/users/{$targetUser->id}/roles", [
                'roles' => ['librarian'],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Roles assigned successfully.',
            ]);

        $this->assertTrue($targetUser->fresh()->hasRole('librarian'));
    }

    public function test_admin_can_assign_direct_permissions_to_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(RoleName::Admin);
        $targetUser = User::factory()->create();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/v1/users/{$targetUser->id}/permissions", [
                'permissions' => ['books.create', 'categories.create'],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Permissions assigned successfully.',
            ]);

        $this->assertTrue($targetUser->fresh()->hasPermissionTo('books.create'));
    }
}
