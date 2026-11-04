<?php

use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BookCopyController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GoogleBooksController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
| Example: http://localhost:8000/api/v1/login
*/
Route::prefix('v1')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Public Routes (No Token Required)
    |--------------------------------------------------------------------------
    */
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    /*
    |--------------------------------------------------------------------------
    | Protected Routes (Requires Sanctum Bearer Token)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::post('/logout', [AuthController::class, 'logout']);

        // User Management APIs
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show'])->whereNumber('id');
        Route::put('/users/{id}', [UserController::class, 'update'])->whereNumber('id');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->whereNumber('id');

        // Category CRUD (by ID)
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{id}', [CategoryController::class, 'show'])->whereNumber('id');
        Route::put('/categories/{id}', [CategoryController::class, 'update'])->whereNumber('id');
        Route::patch('/categories/{id}', [CategoryController::class, 'update'])->whereNumber('id');
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->whereNumber('id');

        // Book CRUD (by ID)
        Route::get('/books', [BookController::class, 'index']);
        Route::post('/books', [BookController::class, 'store']);
        Route::get('/books/{id}', [BookController::class, 'show'])->whereNumber('id');
        Route::put('/books/{id}', [BookController::class, 'update'])->whereNumber('id');
        Route::patch('/books/{id}', [BookController::class, 'update'])->whereNumber('id');
        Route::delete('/books/{id}', [BookController::class, 'destroy'])->whereNumber('id');

        // Book Copies & Barcodes
        Route::get('/book-copies', [BookCopyController::class, 'index']);
        Route::post('/book-copies', [BookCopyController::class, 'store']);
        Route::post('/book-copies/bulk', [BookCopyController::class, 'bulkStore']);
        Route::get('/book-copies/barcode/{barcode}', [BookCopyController::class, 'showByBarcode']);
        Route::get('/book-copies/{id}', [BookCopyController::class, 'show'])->whereNumber('id');
        Route::get('/book-copies/{id}/barcode', [BookCopyController::class, 'barcodeLabel'])->whereNumber('id');
        Route::put('/book-copies/{id}', [BookCopyController::class, 'update'])->whereNumber('id');
        Route::patch('/book-copies/{id}', [BookCopyController::class, 'update'])->whereNumber('id');
        Route::delete('/book-copies/{id}', [BookCopyController::class, 'destroy'])->whereNumber('id');
        Route::post('/books/{id}/copies', [BookCopyController::class, 'storeForBook'])->whereNumber('id');

        // Inventory Management & Tracking
        Route::get('/inventory', [InventoryController::class, 'index']);
        Route::get('/inventory/summary', [InventoryController::class, 'summary']);
        Route::get('/books/{id}/inventory', [InventoryController::class, 'bookInventory'])->whereNumber('id');
        Route::get('/inventory/books/{id}', [InventoryController::class, 'bookInventory'])->whereNumber('id');

        // Loan & Circulation APIs (Borrowing, Returning, Overdue)
        Route::get('/loans', [LoanController::class, 'index']);
        Route::get('/loans/overdue', [LoanController::class, 'overdue']);
        Route::get('/loans/my-loans', [LoanController::class, 'myLoans']);
        Route::post('/loans', [LoanController::class, 'store']);
        Route::post('/borrow', [LoanController::class, 'store']);
        Route::get('/loans/{id}', [LoanController::class, 'show'])->whereNumber('id');
        Route::put('/loans/{id}', [LoanController::class, 'update'])->whereNumber('id');
        Route::delete('/loans/{id}', [LoanController::class, 'destroy'])->whereNumber('id');
        Route::post('/loans/{id}/return', [LoanController::class, 'returnLoan'])->whereNumber('id');
        Route::put('/loans/{id}/return', [LoanController::class, 'returnLoan'])->whereNumber('id');
        Route::post('/return/{id}', [LoanController::class, 'returnLoan'])->whereNumber('id');

        // Google Books API Integration
        Route::get('/google-books/search', [GoogleBooksController::class, 'search']);
        Route::get('/google-books/{googleBookId}', [GoogleBooksController::class, 'show']);
        Route::post('/google-books/import', [GoogleBooksController::class, 'import']);

        // Gemini AI Integration
        Route::post('/ai/recommendations', [AiAssistantController::class, 'recommendations']);
        Route::post('/ai/summarize/{id}', [AiAssistantController::class, 'summarize'])->whereNumber('id');
        Route::post('/ai/chat', [AiAssistantController::class, 'chat']);

        // Dashboard Statistics & Analytics
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/popular-books', [DashboardController::class, 'popularBooks']);
        Route::get('/dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
        Route::get('/dashboard/charts', [DashboardController::class, 'charts']);

        // Role & Permission Management (Admin Only)
        Route::middleware('role:admin')->group(function () {
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store']);
            Route::get('/roles/{role}', [RoleController::class, 'show']);
            Route::get('/permissions', [RoleController::class, 'permissions']);
            Route::post('/users/{id}/roles', [RoleController::class, 'assignRolesToUser'])->whereNumber('id');
            Route::post('/users/{id}/permissions', [RoleController::class, 'assignPermissionsToUser'])->whereNumber('id');
        });
    });
});
