<?php

namespace App\Models;

use Database\Factories\LoanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'book_copy_id', 'issued_by', 'borrowed_at', 'borrowed_id', 'due_at', 'returned_at', 'status'])]
class Loan extends Model
{
    /** @use HasFactory<LoanFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'borrowed_at' => 'date',
            'due_at' => 'date',
            'returned_at' => 'date',
        ];
    }

    /**
     * Get the borrower / user of the loan.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for user relationship.
     *
     * @return BelongsTo<User, $this>
     */
    public function borrower(): BelongsTo
    {
        return $this->user();
    }

    /**
     * Get the book copy associated with the loan.
     *
     * @return BelongsTo<BookCopy, $this>
     */
    public function bookCopy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class, 'book_copy_id');
    }

    /**
     * Get the user (staff/librarian) who issued the loan.
     *
     * @return BelongsTo<User, $this>
     */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /**
     * Alias for issuedBy relationship.
     *
     * @return BelongsTo<User, $this>
     */
    public function issuer(): BelongsTo
    {
        return $this->issuedBy();
    }

    /**
     * Alias accessor/mutator for diagram field borrowed_id.
     *
     * @return Attribute<string|null, mixed>
     */
    protected function borrowedId(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->borrowed_at?->format('Y-m-d') ?? ($this->attributes['borrowed_at'] ?? null),
            set: fn ($value): array => ['borrowed_at' => $value],
        );
    }
}
