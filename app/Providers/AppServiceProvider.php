<?php

namespace App\Providers;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Administrator superuser bypass
        Gate::before(function (User $user, string $ability): ?bool {
            if ($user->hasRole(RoleName::Admin->value)) {
                return true;
            }

            return null;
        });

        // Dynamic permission check gate
        Gate::define('permission', function (User $user, string $permission): bool {
            return $user->hasPermissionTo($permission);
        });
    }
}
