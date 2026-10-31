<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of all categories.
     */
    public function index(): JsonResponse
    {
        return response()->json(Category::all());
    }

    /**
     * Store a newly created category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        return response()->json(Category::create($request->validated()), 201);
    }

    /**
     * Display the specified category by ID.
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Category not found',
            ], 404);
        }

        return response()->json($category);
    }

    /**
     * Update the specified category by ID.
     */
    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Category not found',
            ], 404);
        }

        $category->update($request->validated());

        return response()->json($category);
    }

    /**
     * Remove the specified category by ID.
     */
    public function destroy(int $id): JsonResponse|Response
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Category not found',
            ], 404);
        }

        // Books still point to this category, so the database would reject the delete
        if ($category->books()->exists()) {
            return response()->json(
                ['message' => 'Cannot delete a category that still has books.'],
                409
            );
        }

        $category->delete();

        return response()->noContent();
    }
}
