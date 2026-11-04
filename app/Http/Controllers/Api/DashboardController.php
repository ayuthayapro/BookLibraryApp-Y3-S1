<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Compile comprehensive library and circulation dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        $totalBooks = Book::count();
        $totalCopies = BookCopy::count();
        $availableCopies = BookCopy::available()->count();
        $borrowedCopies = BookCopy::borrowed()->count();

        $totalUsers = User::count();
        $activeBorrowers = User::whereHas('loans', function ($q): void {
            $q->whereNull('returned_at');
        })->count();

        $totalLoans = Loan::count();
        $activeLoans = Loan::whereNull('returned_at')->count();
        $overdueLoans = Loan::whereNull('returned_at')
            ->where('due_at', '<', now()->toDateString())
            ->count();
        $returnedLoans = Loan::whereNotNull('returned_at')->count();

        $returnRate = $totalLoans > 0
            ? round(($returnedLoans / $totalLoans) * 100, 1)
            : 100.0;

        $conditionCounts = BookCopy::query()
            ->selectRaw('condition, count(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition')
            ->all();

        $statusCounts = Loan::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $topCategories = Category::withCount('books')
            ->orderByDesc('books_count')
            ->limit(5)
            ->get(['id', 'name', 'books_count']);

        return response()->json([
            'summary' => [
                'total_books' => $totalBooks,
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'borrowed_copies' => $borrowedCopies,
                'total_users' => $totalUsers,
                'active_borrowers' => $activeBorrowers,
                'total_loans' => $totalLoans,
                'active_loans' => $activeLoans,
                'overdue_loans' => $overdueLoans,
                'returned_loans' => $returnedLoans,
                'return_rate_percentage' => $returnRate,
            ],
            'breakdowns' => [
                'copies_by_condition' => $conditionCounts,
                'loans_by_status' => $statusCounts,
                'top_categories' => $topCategories,
            ],
        ]);
    }

    /**
     * Display the most borrowed / popular books in the catalog.
     */
    public function popularBooks(): JsonResponse
    {
        $books = Book::with('category')
            ->withCount('loans')
            ->orderByDesc('loans_count')
            ->limit(10)
            ->get();

        return response()->json([
            'popular_books' => $books,
        ]);
    }

    /**
     * Display recent circulation activities (loans and returns).
     */
    public function recentActivities(): JsonResponse
    {
        $recentLoans = Loan::with([
            'user:id,name,email',
            'bookCopy.book:id,title,isbn',
        ])
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(function (Loan $loan): array {
                return [
                    'id' => $loan->id,
                    'user' => $loan->user?->name,
                    'user_email' => $loan->user?->email,
                    'book_title' => $loan->bookCopy?->book?->title,
                    'barcode' => $loan->bookCopy?->barcode,
                    'status' => $loan->status,
                    'borrowed_at' => $loan->borrowed_at?->toDateString() ?? $loan->borrowed_at,
                    'due_at' => $loan->due_at?->toDateString() ?? $loan->due_at,
                    'returned_at' => $loan->returned_at?->toDateString() ?? $loan->returned_at,
                    'created_at' => $loan->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'recent_activities' => $recentLoans,
        ]);
    }

    /**
     * Retrieve chart trend data for circulation over recent days.
     */
    public function charts(): JsonResponse
    {
        $trend = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->toDateString();
            $borrowedCount = Loan::whereDate('borrowed_at', $date)->count();
            $returnedCount = Loan::whereDate('returned_at', $date)->count();

            $trend[] = [
                'date' => $date,
                'borrowed' => $borrowedCount,
                'returned' => $returnedCount,
            ];
        }

        return response()->json([
            'daily_circulation_trend' => $trend,
        ]);
    }
}
