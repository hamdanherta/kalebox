<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Cutting;
use Illuminate\Http\Request;

class CuttingController extends Controller
{
    public function index(Request $request)
    {
        $query = Cutting::query();
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('name')->paginate($request->get('per_page', 20)),
        ]);
    }

    public function all()
    {
        return response()->json([
            'success' => true,
            'data' => Cutting::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $count = Cutting::withTrashed()->count() + 1;
        $code = 'CUT-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $cutting = Cutting::create([
            'cutting_code' => $code,
            'name' => $request->name,
        ]);

        AuditLog::log('create_cutting', 'cutting', $cutting->id, null, $cutting->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data cutting berhasil ditambahkan.',
            'data' => $cutting,
        ], 201);
    }

    public function update(Request $request, $cutting)
    {
        $cutting = $cutting instanceof Cutting ? $cutting : Cutting::findOrFail($cutting);
        $request->validate(['name' => 'required|string|max:255']);
        $old = $cutting->toArray();
        $cutting->update(['name' => $request->name]);

        AuditLog::log('update_cutting', 'cutting', $cutting->id, $old, $cutting->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data cutting berhasil diperbarui.',
            'data' => $cutting,
        ]);
    }

    public function destroy($cutting)
    {
        $cutting = $cutting instanceof Cutting ? $cutting : Cutting::findOrFail($cutting);
        $cutting->delete();
        AuditLog::log('delete_cutting', 'cutting', $cutting->id);

        return response()->json([
            'success' => true,
            'message' => 'Data cutting berhasil dihapus.',
        ]);
    }
}
