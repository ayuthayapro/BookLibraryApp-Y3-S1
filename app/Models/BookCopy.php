<?php

namespace App\Models;

use Database\Factories\BookCopyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable(['book_id', 'barcode', 'condition'])]
class BookCopy extends Model
{
    /** @use HasFactory<BookCopyFactory> */
    use HasFactory;

    /**
     * The accessors to append to the model's array and JSON forms.
     *
     * @var array<int, string>
     */
    protected $appends = ['is_available', 'status'];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (BookCopy $copy): void {
            if (empty($copy->barcode)) {
                do {
                    $code = 'LIB-'.strtoupper(Str::random(8));
                } while (static::where('barcode', $code)->exists());

                $copy->barcode = $code;
            }
        });
    }

    /**
     * Scope a query to only include copies that are not currently on loan.
     *
     * @param  Builder<BookCopy>  $query
     * @return Builder<BookCopy>
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->whereDoesntHave('loans', function (Builder $q): void {
            $q->whereNull('returned_at');
        });
    }

    /**
     * Scope a query to only include copies that are currently borrowed.
     *
     * @param  Builder<BookCopy>  $query
     * @return Builder<BookCopy>
     */
    public function scopeBorrowed(Builder $query): Builder
    {
        return $query->whereHas('loans', function (Builder $q): void {
            $q->whereNull('returned_at');
        });
    }

    /**
     * Scope a query to filter copies by condition.
     *
     * @param  Builder<BookCopy>  $query
     * @return Builder<BookCopy>
     */
    public function scopeCondition(Builder $query, string $condition): Builder
    {
        return $query->where('condition', $condition);
    }

    /**
     * Determine if this copy is currently available to borrow.
     *
     * @return Attribute<bool, never>
     */
    protected function isAvailable(): Attribute
    {
        return Attribute::make(
            get: function (): bool {
                if ($this->relationLoaded('activeLoan')) {
                    return $this->activeLoan === null;
                }

                if ($this->relationLoaded('loans')) {
                    return ! $this->loans->contains(fn (Loan $loan): bool => is_null($loan->returned_at));
                }

                return ! $this->loans()->whereNull('returned_at')->exists();
            }
        );
    }

    /**
     * Get computed copy status ('available' or 'borrowed').
     *
     * @return Attribute<string, never>
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: fn (): string => $this->is_available ? 'available' : 'borrowed'
        );
    }

    /**
     * Get the book that owns the copy.
     *
     * @return BelongsTo<Book, $this>
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Get all loans for this copy.
     *
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'book_copy_id');
    }

    /**
     * Get the currently active loan for this copy.
     *
     * @return HasOne<Loan, $this>
     */
    public function activeLoan(): HasOne
    {
        return $this->hasOne(Loan::class, 'book_copy_id')
            ->whereNull('returned_at')
            ->latestOfMany();
    }
}
