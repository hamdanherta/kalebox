<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => Position::with('division')->withCount('employees')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        $position = Position::create($request->only(['name', 'division_id']));
        AuditLog::log('create_position', 'positions', $position->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Posisi kerja berhasil ditambahkan.',
            'data' => $position->load('division'),
        ], 201);
    }

    public function update(Request $request, $position)
    {
        $position = $position instanceof Position ? $position : Position::findOrFail($position);
        $request->validate([
            'name' => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        $position->update($request->only(['name', 'division_id']));
        AuditLog::log('update_position', 'positions', $position->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Posisi kerja berhasil diperbarui.',
            'data' => $position->load('division'),
        ]);
    }

    public function destroy($position)
    {
        $position = $position instanceof Position ? $position : Position::findOrFail($position);
        if ($position->employees()->count() > 0) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Posisi kerja tidak dapat dihapus karena masih digunakan oleh karyawan aktif.',
            ], 422);
        }
        $position->delete();
        AuditLog::log('delete_position', 'positions', $position->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Posisi kerja berhasil dihapus.',
        ]);
    }
}
