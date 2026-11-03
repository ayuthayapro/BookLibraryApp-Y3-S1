<?php

namespace App\Http\Requests\BookCopy;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookCopyRequest extends FormRequest
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
            'book_id' => 'sometimes|required|exists:books,id',
            'barcode'=> ['sometimes','required', 'string', 'max:255',
                Rule::unique('book_copies', 'barcode')->ignore($this->route('id')),
            ],
            'condition' => 'nullable|string|max:255',
        ];
    }
}
