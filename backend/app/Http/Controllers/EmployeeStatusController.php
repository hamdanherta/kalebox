<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\EmployeeStatus;
use Illuminate\Http\Request;

class EmployeeStatusController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => EmployeeStatus::withCount('employees')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->filled('duration_type')) {
            $request->merge(['duration_type' => 'Selamanya']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'duration_type' => 'required|in:Selamanya,Berbatas Waktu',
            'valid_until' => 'nullable|required_if:duration_type,Berbatas Waktu|date',
        ]);

        $status = EmployeeStatus::create($request->only(['name', 'duration_type', 'valid_until']));
        AuditLog::log('create_employee_status', 'employee_statuses', $status->id);

        return response()->json([
            'success' => true,
            'message' => 'Status karyawan berhasil ditambahkan.',
            'data' => $status,
        ], 201);
    }

    public function update(Request $request, $employeeStatus)
    {
        $employeeStatus = $employeeStatus instanceof EmployeeStatus ? $employeeStatus : EmployeeStatus::findOrFail($employeeStatus);
        if (!$request->filled('duration_type')) {
            $request->merge(['duration_type' => $employeeStatus->duration_type ?: 'Selamanya']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'duration_type' => 'required|in:Selamanya,Berbatas Waktu',
            'valid_until' => 'nullable|required_if:duration_type,Berbatas Waktu|date',
        ]);

        $employeeStatus->update($request->only(['name', 'duration_type', 'valid_until']));
        AuditLog::log('update_employee_status', 'employee_statuses', $employeeStatus->id);

        return response()->json([
            'success' => true,
            'message' => 'Status karyawan berhasil diperbarui.',
            'data' => $employeeStatus,
        ]);
    }

    public function destroy($employeeStatus)
    {
        $employeeStatus = $employeeStatus instanceof EmployeeStatus ? $employeeStatus : EmployeeStatus::findOrFail($employeeStatus);
        if ($employeeStatus->employees()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Status karyawan tidak dapat dihapus karena masih digunakan karyawan aktif.',
            ], 422);
        }
        $employeeStatus->delete();
        AuditLog::log('delete_employee_status', 'employee_statuses', $employeeStatus->id);

        return response()->json(['success' => true, 'message' => 'Status karyawan berhasil dihapus.']);
    }
}
