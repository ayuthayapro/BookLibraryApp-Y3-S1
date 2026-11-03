<?php

namespace App\Models;

use Database\Factories\BookCopyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

#[Fillable(['book_id', 'barcode', 'condition'])]
class BookCopy extends Model
{
    /** @use HasFactory<BookCopyFactory> */
    use HasFactory;

    /**
     * Get the book that owns the copy.
     *
     * @return BelongsTo<Book, $this>
     */
    
    protected static function booted()
    {
        static::creating(function ($copy) {

            if(empty($copy->barcode)){
                do {
                    $code = 'LIB-' . strtoupper(Str::random(8));
                } while (static::where('barcode', $code)-> exists());

                $copy->barcode = $code;
            } 
        });
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->whereDoesntHave('loans', function ($q) {
            $q->whereNull('returned_at');
        });
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Get the loans for this copy.
     *
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'book_copy_id');
    }

}
