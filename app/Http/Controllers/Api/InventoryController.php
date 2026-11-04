<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Display overall inventory summary and paginated book inventory records.
     */
    public function index(Request $request): JsonResponse
    {
        $summary = $this->buildSummary();

        $query = Book::with('category')
            ->withCount([
                'bookCopies as total_copies',
                'availableCopies as available_copies',
                'borrowedCopies as borrowed_copies',
            ]);

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->query('category_id'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('low_stock')) {
            $query->having('available_copies', '<=', 1);
        }

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        return response()->json([
            'summary' => $summary,
            'books' => $query->paginate($perPage),
        ]);
    }

    /**
     * Display lightweight inventory statistics summary.
     */
    public function summary(): JsonResponse
    {
        return response()->json($this->buildSummary());
    }

    /**
     * Display detailed inventory tracking for a single book.
     */
    public function bookInventory(int $id): JsonResponse
    {
        $book = Book::with(['category', 'bookCopies.activeLoan.user'])->find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        $copies = $book->bookCopies;
        $totalCopies = $copies->count();
        $availableCopies = $copies->where('is_available', true)->count();
        $borrowedCopies = $copies->where('is_available', false)->count();

        $conditionBreakdown = $copies->groupBy(fn (BookCopy $copy): string => (string) ($copy->condition ?? 'unspecified'))
            ->map(fn ($group) => $group->count())
            ->all();

        return response()->json([
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'isbn' => $book->isbn,
                'authors' => $book->authors,
                'category_id' => $book->category_id,
                'category' => $book->category,
            ],
            'inventory' => [
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'borrowed_copies' => $borrowedCopies,
                'condition_breakdown' => $conditionBreakdown,
            ],
            'copies' => $copies,
        ]);
    }

    /**
     * Compile system-wide inventory metrics.
     *
     * @return array<string, mixed>
     */
    private function buildSummary(): array
    {
        $conditionCounts = BookCopy::query()
            ->selectRaw('condition, count(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition')
            ->all();

        return [
            'total_books' => Book::count(),
            'total_copies' => BookCopy::count(),
            'available_copies' => BookCopy::available()->count(),
            'borrowed_copies' => BookCopy::borrowed()->count(),
            'overdue_copies' => Loan::whereNull('returned_at')
                ->where('due_at', '<', now()->toDateString())
                ->count(),
            'condition_breakdown' => $conditionCounts,
        ];
    }
}
