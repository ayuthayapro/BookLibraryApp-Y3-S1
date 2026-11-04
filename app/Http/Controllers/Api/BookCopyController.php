<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookCopy\BulkStoreBookCopyRequest;
use App\Http\Requests\BookCopy\StoreBookCopyRequest;
use App\Http\Requests\BookCopy\UpdateBookCopyRequest;
use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class BookCopyController extends Controller
{
    /**
     * Display a listing of book copies with filtering, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BookCopy::with(['book.category', 'activeLoan.user']);

        if ($request->filled('book_id')) {
            $query->where('book_id', (int) $request->query('book_id'));
        }

        if ($request->filled('status')) {
            $status = strtolower((string) $request->query('status'));
            if ($status === 'available') {
                $query->available();
            } elseif ($status === 'borrowed') {
                $query->borrowed();
            }
        }

        if ($request->filled('condition')) {
            $query->where('condition', (string) $request->query('condition'));
        }

        if ($request->filled('barcode')) {
            $query->where('barcode', 'like', '%'.$request->query('barcode').'%');
        }

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('barcode', 'like', "%{$search}%")
                    ->orWhereHas('book', function ($bq) use ($search): void {
                        $bq->where('title', 'like', "%{$search}%")
                            ->orWhere('isbn', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Store a newly created book copy.
     */
    public function store(StoreBookCopyRequest $request): JsonResponse
    {
        $copy = BookCopy::create($request->validated());

        return response()->json($copy->load(['book.category']), 201);
    }

    /**
     * Bulk create physical copies for a book.
     */
    public function bulkStore(BulkStoreBookCopyRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $bookId = (int) $validated['book_id'];
        $count = (int) $validated['count'];
        $condition = $validated['condition'] ?? 'good';
        $prefix = $validated['prefix'] ?? null;

        $createdCopies = [];

        for ($i = 0; $i < $count; $i++) {
            $barcode = null;
            if (! empty($prefix)) {
                do {
                    $code = strtoupper($prefix).'-'.strtoupper(Str::random(8));
                } while (BookCopy::where('barcode', $code)->exists());

                $barcode = $code;
            }

            $copy = BookCopy::create([
                'book_id' => $bookId,
                'condition' => $condition,
                'barcode' => $barcode,
            ]);

            $createdCopies[] = $copy;
        }

        return response()->json([
            'message' => "{$count} book copies created successfully.",
            'count' => $count,
            'copies' => $createdCopies,
        ], 201);
    }

    /**
     * Store one or more copies specifically for a book by book ID.
     */
    public function storeForBook(Request $request, int $id): JsonResponse
    {
        $book = Book::find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        $request->validate([
            'count' => 'sometimes|integer|min:1|max:100',
            'condition' => 'sometimes|nullable|string|max:255',
            'barcode' => 'sometimes|nullable|string|max:255|unique:book_copies,barcode',
        ]);

        $count = (int) $request->input('count', 1);
        $condition = $request->input('condition', 'good');

        if ($count === 1 && $request->filled('barcode')) {
            $copy = BookCopy::create([
                'book_id' => $book->id,
                'barcode' => $request->input('barcode'),
                'condition' => $condition,
            ]);

            return response()->json([
                'message' => 'Book copy created successfully.',
                'copies' => [$copy->load(['book.category'])],
            ], 201);
        }

        $createdCopies = [];
        for ($i = 0; $i < $count; $i++) {
            $copy = BookCopy::create([
                'book_id' => $book->id,
                'condition' => $condition,
            ]);
            $createdCopies[] = $copy;
        }

        return response()->json([
            'message' => "{$count} book copies created successfully.",
            'count' => $count,
            'copies' => $createdCopies,
        ], 201);
    }

    /**
     * Display the specified book copy by ID.
     */
    public function show(int $id): JsonResponse
    {
        $copy = BookCopy::with(['book.category', 'activeLoan.user'])->find($id);

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }

        return response()->json($copy);
    }

    /**
     * Display the specified book copy by its unique barcode.
     */
    public function showByBarcode(string $barcode): JsonResponse
    {
        $copy = BookCopy::with(['book.category', 'activeLoan.user'])
            ->where('barcode', $barcode)
            ->first();

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }

        return response()->json($copy);
    }

    /**
     * Return barcode label data for printing or scanning integration.
     */
    public function barcodeLabel(int $id): JsonResponse
    {
        $copy = BookCopy::with('book.category')->find($id);

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }

        return response()->json([
            'id' => $copy->id,
            'barcode' => $copy->barcode,
            'format' => 'CODE128',
            'book_id' => $copy->book_id,
            'book_title' => $copy->book?->title,
            'isbn' => $copy->book?->isbn,
            'authors' => $copy->book?->authors,
            'condition' => $copy->condition,
            'status' => $copy->status,
            'is_available' => $copy->is_available,
            'printable_label' => [
                'title' => $copy->book?->title,
                'barcode' => $copy->barcode,
                'condition' => ucfirst((string) ($copy->condition ?? 'good')),
                'call_number' => 'BC-'.str_pad((string) $copy->id, 6, '0', STR_PAD_LEFT),
            ],
        ]);
    }

    /**
     * Update the specified book copy by ID.
     */
    public function update(UpdateBookCopyRequest $request, int $id): JsonResponse
    {
        $copy = BookCopy::find($id);

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }

        $copy->update($request->validated());

        return response()->json($copy->load(['book.category', 'activeLoan.user']));
    }

    /**
     * Remove the specified book copy by ID.
     */
    public function destroy(int $id): JsonResponse|Response
    {
        $copy = BookCopy::find($id);

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }

        if ($copy->loans()->whereNull('returned_at')->exists()) {
            return response()->json([
                'message' => 'Cannot delete copy that is currently borrowed.',
            ], 409);
        }

        if ($copy->loans()->exists()) {
            return response()->json([
                'message' => 'Cannot delete copy that has loan history.',
            ], 409);
        }

        $copy->delete();

        return response()->noContent();
    }
}
