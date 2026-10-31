<?php

namespace App\Http\Requests\Loan;

use App\Models\Loan;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLoanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'book_copy_id' => [
                'required',
                'integer',
                'exists:book_copies,id',
                function (string $attribute, mixed $value, Closure $fail) {
                    $activeLoanExists = Loan::where('book_copy_id', $value)
                        ->whereNull('returned_at')
                        ->whereIn('status', ['borrowed', 'overdue'])
                        ->exists();

                    if ($activeLoanExists) {
                        $fail('This book copy is currently on loan and cannot be borrowed.');
                    }
                },
            ],
            'borrowed_at' => ['sometimes', 'nullable', 'date'],
            'due_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:borrowed_at'],
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
            'book_copy_id.required' => 'The book copy ID is required to borrow a book.',
            'book_copy_id.exists' => 'The selected book copy does not exist.',
            'user_id.exists' => 'The specified borrower user does not exist.',
            'due_at.after_or_equal' => 'The due date must be on or after the borrowed date.',
        ];
    }
}
