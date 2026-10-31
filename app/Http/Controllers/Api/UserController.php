<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a paginated listing of users with search and filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Search by name or email (compatible with PostgreSQL and SQLite)
        if ($search = $request->query('search')) {
            $like = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                  ->orWhere('email', $like, "%{$search}%");
            });
        }

        // Filter by status (active, inactive, banned)
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Order by latest created and paginate
        $users = $query->withCount('loans')
            ->orderBy('id', 'asc')
            ->paginate($request->query('per_page', 10));

        return response()->json($users);
    }

    /**
     * Display the specified user profile with loan details.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['loans.bookCopy.book', 'favorites.book'])
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'status' => ['sometimes', 'string', 'in:active,inactive,banned'],
            'password' => ['sometimes', 'string', 'min:8'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        // Safety rule 1: Admin cannot delete their own current logged-in account
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 400);
        }

        // Safety rule 2: Cannot delete a user who currently has active borrowed books
        $hasActiveLoans = $user->loans()->where('status', 'borrowed')->exists();
        if ($hasActiveLoans) {
            return response()->json([
                'message' => 'Cannot delete user with active borrowed books. All books must be returned first.',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }
}
