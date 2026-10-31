<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Loan\ReturnLoanRequest;
use App\Http\Requests\Loan\StoreLoanRequest;
use App\Models\Loan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LoanController extends Controller
{
    /**
     * Display a listing of all loans with optional status/user filters.
     */
    public function index(Request $request): JsonResponse
    {
        // Automatically sync overdue status for past-due unreturned loans
        Loan::whereNull('returned_at')
            ->where('due_at', '<', now()->toDateString())
            ->where('status', '!=', 'overdue')
            ->update(['status' => 'overdue']);

        $query = Loan::with(['user', 'bookCopy.book', 'issuedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('book_copy_id')) {
            $query->where('book_copy_id', $request->book_copy_id);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('bookCopy.book', function ($bq) use ($search) {
                    $bq->where('title', 'like', "%{$search}%");
                });
            });
        }

        $loans = $query->orderBy('id', 'desc')
            ->paginate($request->query('per_page', 10));

        return response()->json($loans);
    }

    /**
     * Display all currently overdue loans.
     */
    public function overdue(Request $request): JsonResponse
    {
        // Mark any overdue loans
        Loan::whereNull('returned_at')
            ->where('due_at', '<', now()->toDateString())
            ->where('status', '!=', 'overdue')
            ->update(['status' => 'overdue']);

        $query = Loan::with(['user', 'bookCopy.book', 'issuedBy'])
            ->where(function ($q) {
                $q->where('status', 'overdue')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('returned_at')
                            ->where('due_at', '<', now()->toDateString());
                    });
            });

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $overdueLoans = $query->orderBy('due_at', 'asc')
            ->paginate($request->query('per_page', 10));

        return response()->json($overdueLoans);
    }

    /**
     * Display borrowing history and active loans of the authenticated user.
     */
    public function myLoans(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Sync overdue status
        Loan::where('user_id', $userId)
            ->whereNull('returned_at')
            ->where('due_at', '<', now()->toDateString())
            ->where('status', '!=', 'overdue')
            ->update(['status' => 'overdue']);

        $loans = Loan::with(['bookCopy.book'])
            ->where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->paginate($request->query('per_page', 10));

        return response()->json($loans);
    }

    /**
     * Borrow a book copy (create a new loan record).
     */
    public function store(StoreLoanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $borrowerId = $validated['user_id'] ?? $request->user()->id;
        $borrower = User::find($borrowerId);

        if (! $borrower) {
            return response()->json([
                'message' => 'Borrower user not found',
            ], 404);
        }

        if ($borrower->status !== 'active') {
            return response()->json([
                'message' => 'User account is inactive or banned and cannot borrow books.',
            ], 400);
        }

        $borrowedAt = $validated['borrowed_at'] ?? now()->toDateString();
        $dueAt = $validated['due_at'] ?? Carbon::parse($borrowedAt)->addDays(14)->toDateString();

        $loan = Loan::create([
            'user_id' => $borrowerId,
            'book_copy_id' => $validated['book_copy_id'],
            'issued_by' => $request->user()->id,
            'borrowed_at' => $borrowedAt,
            'due_at' => $dueAt,
            'status' => 'borrowed',
        ]);

        return response()->json([
            'message' => 'Book borrowed successfully.',
            'loan' => $loan->load(['user', 'bookCopy.book', 'issuedBy']),
        ], 201);
    }

    /**
     * Display the specified loan record by ID.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $loan = Loan::with(['user', 'bookCopy.book', 'issuedBy'])->find($id);

        if (! $loan) {
            return response()->json([
                'message' => 'Loan not found',
            ], 404);
        }

        // Auto-check overdue state for single loan
        if (! $loan->returned_at && $loan->due_at && Carbon::parse($loan->due_at)->isPast() && $loan->status !== 'overdue') {
            $loan->update(['status' => 'overdue']);
            $loan->refresh();
        }

        return response()->json($loan);
    }

    /**
     * Return a borrowed book copy by loan ID.
     */
    public function returnLoan(ReturnLoanRequest $request, int $id): JsonResponse
    {
        $loan = Loan::with('bookCopy')->find($id);

        if (! $loan) {
            return response()->json([
                'message' => 'Loan not found',
            ], 404);
        }

        if ($loan->status === 'returned' || $loan->returned_at !== null) {
            return response()->json([
                'message' => 'This book copy has already been returned.',
            ], 400);
        }

        $validated = $request->validated();
        $returnedAt = $validated['returned_at'] ?? now()->toDateString();

        $loan->update([
            'returned_at' => $returnedAt,
            'status' => 'returned',
        ]);

        if (! empty($validated['condition']) && $loan->bookCopy) {
            $loan->bookCopy->update([
                'condition' => $validated['condition'],
            ]);
        }

        return response()->json([
            'message' => 'Book returned successfully.',
            'loan' => $loan->fresh(['user', 'bookCopy.book', 'issuedBy']),
        ]);
    }

    /**
     * Update an existing loan record by ID (e.g. extend due date).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $loan = Loan::find($id);

        if (! $loan) {
            return response()->json([
                'message' => 'Loan not found',
            ], 404);
        }

        $validated = $request->validate([
            'due_at' => ['sometimes', 'required', 'date', 'after:borrowed_at'],
            'status' => ['sometimes', 'required', 'string', 'in:borrowed,returned,overdue'],
        ]);

        $loan->update($validated);

        return response()->json([
            'message' => 'Loan updated successfully.',
            'loan' => $loan->fresh(['user', 'bookCopy.book', 'issuedBy']),
        ]);
    }

    /**
     * Remove the specified loan record by ID.
     */
    public function destroy(int $id): JsonResponse|Response
    {
        $loan = Loan::find($id);

        if (! $loan) {
            return response()->json([
                'message' => 'Loan not found',
            ], 404);
        }

        $loan->delete();

        return response()->noContent();
    }
}

