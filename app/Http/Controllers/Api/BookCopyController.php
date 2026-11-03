<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookCopy\StoreBookCopyRequest;
use App\Http\Requests\BookCopy\UpdateBookCopyRequest;
use App\Models\BookCopy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BookCopyController extends Controller
{
    /**
     * Display a listing of book copies, optionally filtered by book.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BookCopy::with('book');

        if ($request->filled('book_id')) {
            $query->where('book_id', $request->book_id);
        }

        return response()->json($query->paginate(10));
    }

    /**
     * Store a newly created book copy.
     */
    public function store(StoreBookCopyRequest $request): JsonResponse
    {
        $copy = BookCopy::create($request->validated());

        return response()->json($copy->load('book'), 201);
    }

    /**
     * Display the specified book copy by ID.
     */
    public function show(int $id): JsonResponse
    {
        $copy = BookCopy::with('book')->find($id);

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found',
            ], 404);
        }
        return response()->json($copy);
    }


    /**
     * Display by barcode
     */

    public function showByBarcode(string $barcode): JsonResponse 

    {
        $copy = BookCopy::with('book')->where('barcode', $barcode)->first();

        if (! $copy) {
            return response()->json([
                'message' => 'Book copy not found'
            ], 404);
        }

        return response()->json($copy);
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

        return response()->json($copy->load('book'));
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

        // Enable after the loans() relationship exists on BookCopy
        // if ($copy->loans()->exists()) {
        //     return response()->json([
        //         'message' => 'Cannot delete a copy that has loan records',
        //     ], 409);
        // }

        $copy->delete();

        return response()->noContent();
    }
}
