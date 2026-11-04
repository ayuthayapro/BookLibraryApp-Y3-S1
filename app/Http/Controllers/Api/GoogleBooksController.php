<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GoogleBooks\ImportBookRequest;
use App\Services\GoogleBooksService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleBooksController extends Controller
{
    public function __construct(
        protected GoogleBooksService $googleBooksService
    ) {}

    /**
     * Search books online via Google Books API.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required_without:query|nullable|string|max:255',
            'query' => 'required_without:q|nullable|string|max:255',
            'max_results' => 'sometimes|integer|min:1|max:40',
            'start_index' => 'sometimes|integer|min:0',
        ]);

        $query = (string) ($request->query('q') ?? $request->query('query'));
        $maxResults = (int) $request->query('max_results', 10);
        $startIndex = (int) $request->query('start_index', 0);

        $results = $this->googleBooksService->search($query, $maxResults, $startIndex);

        return response()->json($results);
    }

    /**
     * Retrieve volume information by Google Books ID.
     */
    public function show(string $googleBookId): JsonResponse
    {
        $volume = $this->googleBooksService->findVolume($googleBookId);

        if (! $volume) {
            return response()->json([
                'message' => 'Google Books volume not found',
            ], 404);
        }

        return response()->json($volume);
    }

    /**
     * Import a book volume directly from Google Books into library catalog.
     */
    public function import(ImportBookRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $googleBookId = (string) $validated['google_book_id'];
        $categoryId = isset($validated['category_id']) ? (int) $validated['category_id'] : null;
        $copiesCount = (int) ($validated['copies_count'] ?? 1);
        $condition = (string) ($validated['condition'] ?? 'good');

        try {
            $book = $this->googleBooksService->importVolume(
                $googleBookId,
                $categoryId,
                $copiesCount,
                $condition
            );

            return response()->json([
                'message' => 'Book imported successfully from Google Books.',
                'book' => $book,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

