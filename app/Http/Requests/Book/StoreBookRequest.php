<?php

namespace App\Http\Requests\Book;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
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
        return [
            'google_id' => ['nullable', 'string', 'unique:books,google_book_id'],
            'google_book_id' => ['nullable', 'string', 'unique:books,google_book_id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'authors' => ['required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:255', 'unique:books,isbn'],
            'category_id' => ['required', 'exists:categories,id'],
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
            'title.required' => 'The book title is required.',
            'authors.required' => 'The author(s) field is required.',
            'category_id.required' => 'The category selection is required.',
            'category_id.exists' => 'The selected category does not exist.',
            'isbn.unique' => 'The ISBN has already been taken.',
            'google_id.unique' => 'The Google ID has already been taken.',
            'google_book_id.unique' => 'The Google ID has already been taken.',
        ];
    }
}
