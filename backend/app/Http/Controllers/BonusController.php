<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Bonus;
use Illuminate\Http\Request;

class BonusController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => Bonus::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $bonus = Bonus::create($request->only(['name', 'amount', 'description']));
        AuditLog::log('create_bonus', 'bonuses', $bonus->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data bonus berhasil ditambahkan.',
            'data' => $bonus,
        ], 201);
    }

    public function update(Request $request, $bonus)
    {
        $bonus = $bonus instanceof Bonus ? $bonus : Bonus::findOrFail($bonus);
        $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $bonus->update($request->only(['name', 'amount', 'description']));
        AuditLog::log('update_bonus', 'bonuses', $bonus->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data bonus berhasil diperbarui.',
            'data' => $bonus,
        ]);
    }

    public function destroy($bonus)
    {
        $bonus = $bonus instanceof Bonus ? $bonus : Bonus::findOrFail($bonus);
        $bonus->delete();
        AuditLog::log('delete_bonus', 'bonuses', $bonus->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data bonus berhasil dihapus.',
        ]);
    }
}
