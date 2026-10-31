<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::with('category'); // eager load to avoid extra queries

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return $query->paginate(10);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'google_id'   => 'nullable|string|unique:books,google_id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'authors'     => 'required|string|max:255',
            'isbn'        => 'nullable|string|max:255|unique:books,isbn',
            'category_id' => 'required|exists:categories,id',
        ]);

        $book = Book::create($data);

        return response()->json($book->load('category'), 201);
    }

    public function show(Book $book)
    {
        return $book->load('category');
    }

    public function update(Request $request, Book $book)
    {
        $data = $request->validate([
            'google_id'   => ['nullable', 'string', Rule::unique('books', 'google_id')->ignore($book->id)],
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'authors'     => 'sometimes|required|string|max:255',
            'isbn'        => ['nullable', 'string', 'max:255', Rule::unique('books', 'isbn')->ignore($book->id)],
            'category_id' => 'sometimes|required|exists:categories,id',
        ]);

        $book->update($data); 

        return $book->load('category');
    }

    public function destroy($id)
    {
    Book::findOrFail($id)->delete();

    return response()->noContent();
    }

}
