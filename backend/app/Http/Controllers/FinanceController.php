<?php

namespace App\Http\Controllers;

use App\Models\FinanceTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $query = FinanceTransaction::with(['order:id,order_number', 'creator:id,name']);

        if ($request->filled('type')) {
            $t = strtolower($request->type);
            if (in_array($t, ['income', 'pemasukan'])) {
                $query->whereIn('type', ['income', 'Pemasukan']);
            } elseif (in_array($t, ['expense', 'pengeluaran'])) {
                $query->whereIn('type', ['expense', 'Pengeluaran']);
            }
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('transaction_number', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $transactions
        ]);
    }

    public function summary()
    {
        $totalIncome = FinanceTransaction::whereIn('type', ['income', 'Pemasukan'])->sum('amount');
        $totalExpense = FinanceTransaction::whereIn('type', ['expense', 'Pengeluaran'])->sum('amount');
        $netProfit = $totalIncome - $totalExpense;

        // Current month
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $monthIncome = FinanceTransaction::whereIn('type', ['income', 'Pemasukan'])
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $monthExpense = FinanceTransaction::whereIn('type', ['expense', 'Pengeluaran'])
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_income' => (float)$totalIncome,
                'total_expense' => (float)$totalExpense,
                'net_profit' => (float)$netProfit,
                'this_month_income' => (float)$monthIncome,
                'this_month_expense' => (float)$monthExpense,
                'this_month_profit' => (float)($monthIncome - $monthExpense),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $rawType = strtolower((string)$request->input('type', ''));
        if (in_array($rawType, ['pemasukan', 'income', 'masuk'])) {
            $request->merge(['type' => 'income']);
        } elseif (in_array($rawType, ['pengeluaran', 'expense', 'keluar'])) {
            $request->merge(['type' => 'expense']);
        }

        $data = $request->validate([
            'type' => 'required|in:income,expense',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:1',
            'transaction_date' => 'required|date',
            'description' => 'required|string',
            'proof_file' => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        $proofPath = null;
        if ($request->hasFile('proof_file')) {
            $proofPath = '/storage/' . $request->file('proof_file')->store('finance_proofs', 'public');
        }

        $trxNumber = 'TRX-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $transaction = FinanceTransaction::create([
            'transaction_number' => $trxNumber,
            'type' => $data['type'],
            'category' => $data['category'],
            'amount' => $data['amount'],
            'transaction_date' => $data['transaction_date'],
            'description' => $data['description'],
            'proof_file' => $proofPath,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi keuangan berhasil dicatat',
            'data' => $transaction
        ], 201);
    }

    public function destroy($id)
    {
        $transaction = FinanceTransaction::findOrFail($id);
        $transaction->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil dihapus'
        ]);
    }
}
