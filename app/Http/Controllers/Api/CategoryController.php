<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        return response()->json(Category::create($data), 201);
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255',
                Rule::unique('categories', 'name')->ignore($category->id)],
        ]);

        $category->update($data);
        return $category;
    }

    public function destroy(Category $category)
    {
        // Books still point to this category, so the database would reject the delete
        if ($category->books()->exists()) {
            return response()->json(
                ['message' => 'Cannot delete a category that still has books.'], 409
            );
        }

        $category->delete();
        return response()->noContent();
    }
}
