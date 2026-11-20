<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Finishing;
use Illuminate\Http\Request;

class FinishingController extends Controller
{
    public function index(Request $request)
    {
        $query = Finishing::query();
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
            'data' => Finishing::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $count = Finishing::withTrashed()->count() + 1;
        $code = 'FIN-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $finishing = Finishing::create([
            'finishing_code' => $code,
            'name' => $request->name,
        ]);

        AuditLog::log('create_finishing', 'finishing', $finishing->id, null, $finishing->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data finishing berhasil ditambahkan.',
            'data' => $finishing,
        ], 201);
    }

    public function update(Request $request, $finishing)
    {
        $finishing = $finishing instanceof Finishing ? $finishing : Finishing::findOrFail($finishing);
        $request->validate(['name' => 'required|string|max:255']);
        $old = $finishing->toArray();
        $finishing->update(['name' => $request->name]);

        AuditLog::log('update_finishing', 'finishing', $finishing->id, $old, $finishing->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data finishing berhasil diperbarui.',
            'data' => $finishing,
        ]);
    }

    public function destroy($finishing)
    {
        $finishing = $finishing instanceof Finishing ? $finishing : Finishing::findOrFail($finishing);
        $finishing->delete();
        AuditLog::log('delete_finishing', 'finishing', $finishing->id);

        return response()->json([
            'success' => true,
            'message' => 'Data finishing berhasil dihapus.',
        ]);
    }
}
