<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BookController extends Controller
{
    /**
     * Display a listing of books with search and filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Book::with('category'); // eager load to avoid extra queries

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        return response()->json($query->paginate(10));
    }

    /**
     * Store a newly created book.
     */
    public function store(StoreBookRequest $request): JsonResponse
    {
        $book = Book::create($request->validated());

        return response()->json($book->load('category'), 201);
    }

    /**
     * Display the specified book by ID.
     */
    public function show(int $id): JsonResponse
    {
        $book = Book::with('category')->find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        return response()->json($book);
    }

    /**
     * Update the specified book by ID.
     */
    public function update(UpdateBookRequest $request, int $id): JsonResponse
    {
        $book = Book::find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        $book->update($request->validated());

        return response()->json($book->load('category'));
    }

    /**
     * Remove the specified book by ID.
     */
    public function destroy(int $id): JsonResponse|Response
    {
        $book = Book::find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        $book->delete();

        return response()->noContent();
    }
}
