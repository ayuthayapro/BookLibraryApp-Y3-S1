<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $book = $this->route('book') ?? $this->route('id');
        $bookId = $book instanceof Book ? $book->id : $book;

        return [
            'google_id' => ['nullable', 'string', Rule::unique('books', 'google_book_id')->ignore($bookId)],
            'google_book_id' => ['nullable', 'string', Rule::unique('books', 'google_book_id')->ignore($bookId)],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'authors' => ['sometimes', 'required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:255', Rule::unique('books', 'isbn')->ignore($bookId)],
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The book title cannot be empty.',
            'category_id.exists' => 'The selected category does not exist.',
            'isbn.unique' => 'The ISBN has already been taken.',
            'google_id.unique' => 'The Google ID has already been taken.',
            'google_book_id.unique' => 'The Google ID has already been taken.',
        ];
    }
}
