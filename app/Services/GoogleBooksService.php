<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleBooksService
{
    protected string $baseUrl;

    protected ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = (string) config('services.google_books.base_url', 'https://www.googleapis.com/books/v1');
        $this->apiKey = config('services.google_books.api_key');
    }

    /**
     * Search books in Google Books API.
     *
     * @return array<string, mixed>
     */
    public function search(string $query, int $maxResults = 10, int $startIndex = 0): array
    {
        $params = [
            'q' => $query,
            'maxResults' => min(max($maxResults, 1), 40),
            'startIndex' => max($startIndex, 0),
        ];

        if (! empty($this->apiKey)) {
            $params['key'] = $this->apiKey;
        }

        $response = Http::get("{$this->baseUrl}/volumes", $params);

        if (! $response->successful()) {
            return [
                'total_items' => 0,
                'items' => [],
                'error' => $response->json('error.message') ?? 'Failed to fetch from Google Books API',
            ];
        }

        $data = $response->json();
        $rawItems = $data['items'] ?? [];

        $items = array_map(function (array $rawItem): array {
            return $this->formatVolume($rawItem);
        }, $rawItems);

        return [
            'total_items' => (int) ($data['totalItems'] ?? count($items)),
            'items' => $items,
        ];
    }

    /**
     * Retrieve a single volume by its Google Books ID.
     *
     * @return array<string, mixed>|null
     */
    public function findVolume(string $googleBookId): ?array
    {
        $params = [];
        if (! empty($this->apiKey)) {
            $params['key'] = $this->apiKey;
        }

        $response = Http::get("{$this->baseUrl}/volumes/{$googleBookId}", $params);

        if (! $response->successful()) {
            return null;
        }

        return $this->formatVolume($response->json());
    }

    /**
     * Import a book from Google Books directly into local database catalog.
     */
    public function importVolume(string $googleBookId, ?int $categoryId = null, int $initialCopies = 1, string $condition = 'good'): Book
    {
        $volume = $this->findVolume($googleBookId);

        if (! $volume) {
            throw new RuntimeException("Google Book volume not found with ID: {$googleBookId}");
        }

        if ($categoryId === null) {
            $categoryName = ! empty($volume['categories']) ? (string) $volume['categories'][0] : 'General';
            $category = Category::firstOrCreate(['name' => $categoryName]);
            $categoryId = $category->id;
        }

        $book = Book::updateOrCreate(
            ['google_book_id' => $googleBookId],
            [
                'title' => $volume['title'] ?: 'Untitled',
                'authors' => $volume['authors'] ?: 'Unknown Author',
                'description' => $volume['description'] ?: null,
                'isbn' => $volume['isbn'] ?: null,
                'category_id' => $categoryId,
            ]
        );

        $initialCopies = min(max($initialCopies, 0), 50);
        for ($i = 0; $i < $initialCopies; $i++) {
            BookCopy::create([
                'book_id' => $book->id,
                'condition' => $condition,
            ]);
        }

        return $book->load(['category', 'bookCopies']);
    }

    /**
     * Standardize Google Books API volume payload.
     *
     * @param  array<string, mixed>  $rawItem
     * @return array<string, mixed>
     */
    private function formatVolume(array $rawItem): array
    {
        $volumeInfo = $rawItem['volumeInfo'] ?? [];

        // Extract best ISBN (prefer ISBN_13, fallback to ISBN_10)
        $isbn = null;
        $identifiers = $volumeInfo['industryIdentifiers'] ?? [];
        foreach ($identifiers as $id) {
            if (($id['type'] ?? '') === 'ISBN_13') {
                $isbn = $id['identifier'] ?? null;
                break;
            }
            if (($id['type'] ?? '') === 'ISBN_10' && $isbn === null) {
                $isbn = $id['identifier'] ?? null;
            }
        }

        $authors = $volumeInfo['authors'] ?? [];
        $authorsString = is_array($authors) ? implode(', ', $authors) : (string) $authors;

        return [
            'google_book_id' => (string) ($rawItem['id'] ?? ''),
            'title' => (string) ($volumeInfo['title'] ?? ''),
            'subtitle' => $volumeInfo['subtitle'] ?? null,
            'authors' => $authorsString,
            'description' => $volumeInfo['description'] ?? null,
            'isbn' => $isbn,
            'categories' => $volumeInfo['categories'] ?? [],
            'page_count' => $volumeInfo['pageCount'] ?? null,
            'published_date' => $volumeInfo['publishedDate'] ?? null,
            'publisher' => $volumeInfo['publisher'] ?? null,
            'language' => $volumeInfo['language'] ?? 'en',
            'thumbnail' => $volumeInfo['imageLinks']['thumbnail'] ?? $volumeInfo['imageLinks']['smallThumbnail'] ?? null,
        ];
    }
}
