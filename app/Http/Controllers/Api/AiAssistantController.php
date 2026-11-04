<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\User;
use App\Services\GeminiService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Get personalized AI book recommendations for the user.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'sometimes|nullable|integer|exists:users,id',
            'preferences' => 'sometimes|nullable|string|max:500',
        ]);

        $userId = $request->input('user_id') ?? $request->user()->id;
        $user = User::find($userId);

        if (! $user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        try {
            $recommendations = $this->geminiService->recommendBooks(
                $user,
                $request->input('preferences')
            );

            return response()->json($recommendations);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to generate recommendations: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate an AI-powered summary and thematic breakdown for a book.
     */
    public function summarize(int $id): JsonResponse
    {
        $book = Book::with('category')->find($id);

        if (! $book) {
            return response()->json([
                'message' => 'Book not found',
            ], 404);
        }

        try {
            $summary = $this->geminiService->summarizeBook($book);

            return response()->json($summary);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to generate summary: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Conversational library AI assistant chat endpoint.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'sometimes|array',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:1000',
        ]);

        $message = (string) $request->input('message');
        $history = (array) $request->input('history', []);

        try {
            $reply = $this->geminiService->chat($message, $history);

            return response()->json([
                'reply' => $reply,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'AI Assistant error: '.$e->getMessage(),
            ], 500);
        }
    }
}

