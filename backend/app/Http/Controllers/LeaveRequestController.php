<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\LeaveRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LeaveRequestController extends Controller
{
    /**
     * List all leaves (Owner & Manager can see all, employees see only theirs)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LeaveRequest::with(['employee.position', 'approver']);

        // Jika karyawan biasa (selain Owner & Manager), batasi hanya milik sendiri
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

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $leaves = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'data' => $leaves,
        ]);
    }

    /**
     * List leaves for currently logged-in employee
     */
    public function myLeaves(Request $request)
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

        $leaves = LeaveRequest::with(['employee.position', 'approver'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'data' => $leaves,
        ]);
    }

    /**
     * Submit a new leave / sick / permission request
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'success' => false,
                'message' => 'Profil data karyawan Anda belum terdaftar dalam sistem.',
            ], 422);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'type'       => 'required|string|in:Sakit,Izin,Cuti,sakit,izin,cuti,SAKIT,IZIN,CUTI',
            'reason'     => 'required|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
        ], [
            'type.required'            => 'Pilih jenis dispensasi (Cuti, Sakit, atau Izin).',
            'type.in'                  => 'Jenis dispensasi tidak valid. Pilih Cuti, Sakit, atau Izin.',
            'start_date.required'      => 'Tanggal mulai dispensasi wajib diisi.',
            'start_date.date'          => 'Format tanggal mulai tidak valid.',
            'end_date.required'        => 'Tanggal selesai dispensasi wajib diisi.',
            'end_date.date'            => 'Format tanggal selesai tidak valid.',
            'end_date.after_or_equal'  => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'reason.required'          => 'Alasan pengajuan cuti/izin wajib diisi.',
            'attachment.mimes'         => 'Format lampiran harus berupa JPG, PNG, WEBP, atau PDF.',
            'attachment.max'           => 'Ukuran file lampiran maksimal 10MB.',
        ]);

        // Standarisasi nama tipe ke TitleCase (Cuti, Sakit, Izin)
        $rawType = strtolower(trim($request->input('type')));
        $type = match ($rawType) {
            'sakit' => 'Sakit',
            'cuti'  => 'Cuti',
            default => 'Izin',
        };

        $attachPath = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $ext = $file->getClientOriginalExtension();
            $filename = Str::random(32) . '.' . $ext;
            $path = $file->storeAs('leave_attachments', $filename, 'public');
            $attachPath = '/storage/' . $path;
        }

        $leave = LeaveRequest::create([
            'employee_id'     => $employee->id,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
            'type'            => $type,
            'reason'          => $request->reason,
            'attachment_path' => $attachPath,
            'status'          => 'menunggu',
        ]);

        // Notifikasi ke Manager & Owner
        $executives = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager']))->get();
        foreach ($executives as $exec) {
            Notification::create([
                'user_id'        => $exec->id,
                'title'          => 'Pengajuan Cuti / Izin Baru',
                'message'        => "Karyawan {$employee->name} mengajukan dispensasi {$type} ({$request->start_date} s/d {$request->end_date}).",
                'type'           => 'leave_request',
                'reference_id'   => $leave->id,
                'reference_type' => 'leave_request',
            ]);
        }

        AuditLog::log('submit_leave', 'leave_requests', $leave->id, null, [
            'type'       => $type,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'reason'     => $request->reason,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Pengajuan cuti/izin berhasil dikirim dan menunggu persetujuan manajemen.',
            'data'    => $leave->load('employee.position'),
        ], 201);
    }

    /**
     * Update leave request status (Approve / Reject) by Owner or Manager
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isOwner() && !$user->isManager()) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Hanya Owner atau Manager yang memiliki wewenang untuk menyetujui atau menolak permohonan cuti.',
            ], 403);
        }

        $leaveRequest = LeaveRequest::findOrFail($id);

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

        $leaveRequest->update([
            'status'         => $normalizedStatus,
            'approved_by'    => $user->id,
            'rejection_note' => $normalizedStatus === 'ditolak' ? ($request->rejection_note ?? 'Pengajuan ditolak oleh pimpinan.') : null,
        ]);

        // Notifikasi ke karyawan pemohon
        $empUser = $leaveRequest->employee?->user;
        if ($empUser) {
            $isApproved = ($normalizedStatus === 'disetujui');
            Notification::create([
                'user_id'      => $empUser->id,
                'title'        => $isApproved ? 'Pengajuan Cuti / Izin Disetujui' : 'Pengajuan Cuti / Izin Ditolak',
                'message'      => $isApproved
                    ? "Permohonan {$leaveRequest->type} Anda untuk tanggal {$leaveRequest->start_date} telah disetujui."
                    : "Permohonan {$leaveRequest->type} Anda ditolak. " . ($leaveRequest->rejection_note ? "Alasan: {$leaveRequest->rejection_note}" : ''),
                'type'         => $isApproved ? 'leave_approved' : 'leave_rejected',
                'reference_id' => $leaveRequest->id,
            ]);
        }

        AuditLog::log('update_leave_status', 'leave_requests', $leaveRequest->id, null, [
            'status' => $normalizedStatus,
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => $normalizedStatus === 'disetujui' ? 'Pengajuan cuti/izin berhasil disetujui.' : 'Pengajuan cuti/izin telah ditolak.',
            'data'    => $leaveRequest->fresh(['employee.position', 'approver']),
        ]);
    }

    /**
     * Backward-compatible approve method
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $request->merge(['status' => 'disetujui']);
        return $this->updateStatus($request, $leaveRequest->id);
    }

    /**
     * Backward-compatible reject method
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $request->merge(['status' => 'ditolak']);
        return $this->updateStatus($request, $leaveRequest->id);
    }

    /**
     * Delete / cancel a leave request
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $leave = LeaveRequest::findOrFail($id);

        if (!$user->isOwner() && !$user->isManager()) {
            if ($leave->employee_id !== $user->employee?->id) {
                return response()->json([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak akses untuk menghapus pengajuan cuti ini.',
                ], 403);
            }
            if ($leave->status !== 'menunggu') {
                return response()->json([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'Pengajuan cuti yang sudah diproses tidak dapat dihapus.',
                ], 422);
            }
        }

        $leave->delete();
        AuditLog::log('delete_leave', 'leave_requests', $id);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Data pengajuan cuti berhasil dihapus.',
        ]);
    }
}
