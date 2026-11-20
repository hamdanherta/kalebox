<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\Overtime;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class OvertimeController extends Controller
{
    /**
     * List all overtime submissions
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Overtime::with(['employee.position', 'creator', 'approver']);

        // Jika karyawan biasa, hanya melihat lembur miliknya sendiri
        if (!$user->isOwner() && !$user->isManager()) {
            if ($user->employee) {
                $query->where('employee_id', $user->employee->id);
            } else {
                return response()->json([
                    'status' => 'success',
                    'success' => true,
                    'data' => [],
                ]);
            }
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        if ($request->filled('status')) {
            $status = strtolower($request->status);
            if (in_array($status, ['approved', 'disetujui'])) {
                $query->where('status', 'disetujui');
            } elseif (in_array($status, ['rejected', 'ditolak'])) {
                $query->where('status', 'ditolak');
            } elseif (in_array($status, ['pending', 'menunggu'])) {
                $query->where('status', 'menunggu');
            } else {
                $query->where('status', $request->status);
            }
        }

        $overtimes = $query->orderBy('date', 'desc')->paginate(20);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'data' => $overtimes,
        ]);
    }

    /**
     * List overtime for currently logged-in employee
     */
    public function myOvertimes(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'status' => 'success',
                'success' => true,
                'data' => [],
            ]);
        }

        $overtimes = Overtime::with(['employee.position', 'creator', 'approver'])
            ->where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'data' => $overtimes,
        ]);
    }

    /**
     * Submit an overtime request
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Tentukan target karyawan
        $employeeId = $request->input('employee_id');
        if (!$employeeId) {
            $employeeId = $user->employee?->id;
        }

        if (!$employeeId) {
            return response()->json([
                'status' => 'error',
                'success' => false,
                'message' => 'Profil karyawan tidak ditemukan untuk pengajuan lembur ini.',
            ], 422);
        }

        $employee = Employee::find($employeeId);
        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'success' => false,
                'message' => 'Data karyawan terpilih tidak valid.',
            ], 422);
        }

        $request->validate([
            'date'          => 'required|date',
            'start_time'    => 'required',
            'end_time'      => 'required',
            'rate_per_hour' => 'nullable|numeric|min:0',
            'notes'         => 'nullable|string',
        ], [
            'date.required'       => 'Tanggal lembur wajib diisi.',
            'date.date'           => 'Format tanggal lembur tidak valid.',
            'start_time.required' => 'Jam mulai lembur wajib diisi.',
            'end_time.required'   => 'Jam selesai lembur wajib diisi.',
        ]);

        $start = Carbon::parse($request->date . ' ' . $request->start_time);
        $end = Carbon::parse($request->date . ' ' . $request->end_time);

        if ($end->isBefore($start)) {
            $end->addDay(); // Lembur lewat tengah malam
        }

        $durationMinutes = $start->diffInMinutes($end);
        $durationHours = round($durationMinutes / 60, 2);

        // Jika rate_per_hour tidak ditentukan, hitung otomatis dari gaji harian / 8 jam (standar Depnaker)
        $ratePerHour = $request->filled('rate_per_hour') && floatval($request->rate_per_hour) > 0
            ? floatval($request->rate_per_hour)
            : ($employee->daily_salary > 0 ? round($employee->daily_salary / 8, 2) : 15000);

        $totalPay = round($durationHours * $ratePerHour, 2);

        $overtime = Overtime::create([
            'employee_id'    => $employee->id,
            'date'           => $request->date,
            'start_time'     => $request->start_time,
            'end_time'       => $request->end_time,
            'rate_per_hour'  => $ratePerHour,
            'duration_hours' => $durationHours,
            'total_pay'      => $totalPay,
            'notes'          => $request->notes,
            'status'         => 'menunggu',
            'created_by'     => $user->id,
        ]);

        // Notifikasi ke Manager & Owner
        $executives = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager']))->get();
        foreach ($executives as $exec) {
            Notification::create([
                'user_id'        => $exec->id,
                'title'          => 'Pengajuan Lembur Baru',
                'message'        => "Karyawan {$employee->name} mengajukan lembur {$durationHours} jam pada {$request->date}.",
                'type'           => 'overtime_request',
                'reference_id'   => $overtime->id,
                'reference_type' => 'overtime_request',
            ]);
        }

        AuditLog::log('create_overtime', 'overtimes', $overtime->id, null, $overtime->toArray());

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Pengajuan lembur berhasil dicatat dan menunggu persetujuan.',
            'data'    => $overtime->load(['employee.position', 'creator']),
        ], 201);
    }

    /**
     * Update overtime request status (Approve / Reject) by Owner or Manager
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isOwner() && !$user->isManager()) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Hanya Owner atau Manager yang dapat menyetujui atau menolak permohonan lembur.',
            ], 403);
        }

        $overtime = Overtime::findOrFail($id);

        $request->validate([
            'status'         => 'required|string',
            'rejection_note' => 'nullable|string',
        ]);

        $rawStatus = strtolower(trim($request->status));
        $normalizedStatus = match ($rawStatus) {
            'approved', 'disetujui' => 'disetujui',
            'rejected', 'ditolak'   => 'ditolak',
            default                 => 'menunggu',
        };

        $overtime->update([
            'status'         => $normalizedStatus,
            'approved_by'    => $user->id,
            'rejection_note' => $normalizedStatus === 'ditolak' ? ($request->rejection_note ?? 'Pengajuan lembur ditolak oleh pimpinan.') : null,
        ]);

        // Notifikasi ke karyawan pemohon
        $empUser = $overtime->employee?->user;
        if ($empUser) {
            $isApproved = ($normalizedStatus === 'disetujui');
            Notification::create([
                'user_id'      => $empUser->id,
                'title'        => $isApproved ? 'Pengajuan Lembur Disetujui' : 'Pengajuan Lembur Ditolak',
                'message'      => $isApproved
                    ? "Pengajuan lembur {$overtime->duration_hours} jam Anda untuk tanggal {$overtime->date} telah disetujui."
                    : "Pengajuan lembur Anda untuk tanggal {$overtime->date} telah ditolak.",
                'type'         => $isApproved ? 'overtime_approved' : 'overtime_rejected',
                'reference_id' => $overtime->id,
            ]);
        }

        AuditLog::log('update_overtime_status', 'overtimes', $overtime->id, null, [
            'status'      => $normalizedStatus,
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => $normalizedStatus === 'disetujui' ? 'Pengajuan lembur berhasil disetujui.' : 'Pengajuan lembur telah ditolak.',
            'data'    => $overtime->fresh(['employee.position', 'creator', 'approver']),
        ]);
    }

    /**
     * Delete overtime record
     */
    public function destroy(Overtime $overtime)
    {
        $overtime->delete();
        AuditLog::log('delete_overtime', 'overtimes', $overtime->id);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Data lembur berhasil dihapus.',
        ]);
    }
}
