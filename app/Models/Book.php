<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['category_id', 'google_book_id', 'google_id', 'title', 'description', 'desciption', 'authors', 'isbn'])]
class Book extends Model
{
    /** @use HasFactory<BookFactory> */
    use HasFactory;

    /**
     * Get the category that the book belongs to.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the physical copies of the book.
     *
     * @return HasMany<BookCopy, $this>
     */
    public function bookCopies(): HasMany
    {
        return $this->hasMany(BookCopy::class, 'book_id');
    }

    /**
     * Alias for bookCopies relationship.
     *
     * @return HasMany<BookCopy, $this>
     */
    public function copies(): HasMany
    {
        return $this->bookCopies();
    }

    /**
     * Get the favorites records for this book.
     *
     * @return HasMany<Favorite, $this>
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class, 'book_id');
    }

    /**
     * Get the users who favorited this book.
     *
     * @return BelongsToMany<User, $this>
     */
    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites', 'book_id', 'user_id')->withTimestamps();
    }

    /**
     * Get all loans through book copies.
     *
     * @return HasManyThrough<Loan, BookCopy, $this>
     */
    public function loans(): HasManyThrough
    {
        return $this->hasManyThrough(Loan::class, BookCopy::class, 'book_id', 'book_copy_id');
    }

    /**
     * Alias accessor/mutator for google_id.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function googleId(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->google_book_id,
            set: fn (?string $value): array => ['google_book_id' => $value],
        );
    }

    /**
     * Alias accessor/mutator for diagram typo desciption.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function desciption(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->description,
            set: fn (?string $value): array => ['description' => $value],
        );
    }
}
