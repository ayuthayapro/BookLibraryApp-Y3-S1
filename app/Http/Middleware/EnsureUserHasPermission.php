<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $parsedPermissions = [];
        foreach ($permissions as $permission) {
            foreach (explode(',', $permission) as $p) {
                $trimmed = trim($p);
                if ($trimmed !== '') {
                    $parsedPermissions[] = $trimmed;
                }
            }
        }

        $hasAccess = false;
        foreach ($parsedPermissions as $permissionName) {
            if ($user->hasPermissionTo($permissionName)) {
                $hasAccess = true;
                break;
            }
        }

        if (! $hasAccess) {
            return response()->json([
                'message' => 'Forbidden: You do not have the required permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
