<?php

namespace App\Http\Requests\GoogleBooks;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportBookRequest extends FormRequest
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
            'google_book_id' => 'required|string|max:255',
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'copies_count' => 'sometimes|integer|min:0|max:50',
            'condition' => 'sometimes|nullable|string|max:255',
        ];
    }
}
