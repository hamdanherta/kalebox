<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Division;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => Division::withCount('positions')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255|unique:divisions,name']);
        $division = Division::create(['name' => $request->name]);
        AuditLog::log('create_division', 'divisions', $division->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Divisi berhasil ditambahkan.',
            'data' => $division,
        ], 201);
    }

    public function update(Request $request, $division)
    {
        $division = $division instanceof Division ? $division : Division::findOrFail($division);
        $request->validate(['name' => 'required|string|max:255|unique:divisions,name,' . $division->id]);
        $division->update(['name' => $request->name]);
        AuditLog::log('update_division', 'divisions', $division->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Divisi berhasil diperbarui.',
            'data' => $division,
        ]);
    }

    public function destroy($division)
    {
        $division = $division instanceof Division ? $division : Division::findOrFail($division);
        if ($division->positions()->count() > 0) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Divisi tidak dapat dihapus karena masih memiliki posisi kerja terkait.',
            ], 422);
        }
        $division->delete();
        AuditLog::log('delete_division', 'divisions', $division->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Divisi berhasil dihapus.',
        ]);
    }
}
