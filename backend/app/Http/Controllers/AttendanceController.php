<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Setting;
use App\Models\WorkSchedule;
use App\Services\ImageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Data Absensi Hari Ini (Realtime untuk Pengguna Aktif & Seluruh Karyawan)
     */
    public function today(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();
        $employee = $user?->employee;

        $myAttendance = null;
        if ($employee) {
            $myAttendance = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();
        }

        $employees = Employee::with(['user.role', 'position'])->get();
        $schedule = WorkSchedule::getDefault();
        $startTime = $schedule ? $schedule->start_time : '08:00:00';
        $limitCutoff = Carbon::parse($startTime)->addHours(3);

        $results = [];

        foreach ($employees as $emp) {
            $att = Attendance::where('employee_id', $emp->id)
                ->where('date', $today)
                ->first();

            // Cek jika ada cuti sakit/izin yang aktif hari ini
            $leave = LeaveRequest::where('employee_id', $emp->id)
                ->where('status', 'disetujui')
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->first();

            if (!$att) {
                // Tentukan status default jika belum ada record absensi
                $status = 'Menunggu';
                if ($leave) {
                    $status = $leave->type; // 'Izin' atau 'Sakit'
                } elseif (now()->isAfter($limitCutoff)) {
                    $status = 'Tidak Masuk'; // Lewat batas toleransi 3 jam
                }

                $results[] = [
                    'employee' => $emp,
                    'attendance' => null,
                    'status' => $status,
                    'check_in_time' => null,
                    'check_out_time' => null,
                    'is_late' => false,
                ];
            } else {
                $results[] = [
                    'employee' => $emp,
                    'attendance' => $att,
                    'status' => $att->status,
                    'check_in_time' => $att->check_in_time,
                    'check_out_time' => $att->check_out_time,
                    'is_late' => $att->is_late,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => [
                'date' => $today,
                'office_lat' => (float) Setting::get('office_lat', Attendance::OFFICE_LAT),
                'office_lng' => (float) Setting::get('office_lng', Attendance::OFFICE_LNG),
                'max_radius_meter' => (float) Setting::get('attendance_radius_meter', Attendance::MAX_RADIUS_METER),
                // Status presensi khusus untuk user yang sedang login saat ini:
                'has_checked_in' => (bool) ($myAttendance && $myAttendance->check_in_time),
                'has_checked_out' => (bool) ($myAttendance && $myAttendance->check_out_time),
                'check_in_time' => $myAttendance?->check_in_time,
                'check_out_time' => $myAttendance?->check_out_time,
                'status' => $myAttendance?->status ?? 'Belum Absen',
                'is_late' => (bool) $myAttendance?->is_late,
                'my_attendance' => $myAttendance,
                'records' => $results,
            ],
        ]);
    }

    /**
     * Data Presensi Semua Karyawan (Route: GET /attendance/all)
     */
    public function index(Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $attendances = Attendance::with(['employee.position.division', 'employee.user'])
            ->where('date', $date)
            ->orderBy('check_in_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $attendances,
        ]);
    }

    /**
     * Alias untuk Route: GET /attendance/history
     */
    public function history(Request $request)
    {
        return $this->myHistory($request);
    }

    /**
     * Riwayat Absensi Karyawan yang Sedang Login
     */
    public function myHistory(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Profil karyawan tidak ditemukan.'
            ], 404);
        }

        $attendances = Attendance::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->paginate(30);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $attendances,
        ]);
    }

    /**
     * Absen Masuk (Check-In)
     * Menggunakan foto selfie dan validasi geofence Haversine radius kantor di backend
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'photo' => 'required',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Akun Anda tidak terhubung dengan profil karyawan.',
            ], 422);
        }

        $today = Carbon::today()->toDateString();
        $existing = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();

        if ($existing && $existing->check_in_time) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen masuk hari ini pada pukul ' . $existing->check_in_time,
            ], 422);
        }

        // Koordinat Kantor & Radius Maksimal dari Pengaturan
        $officeLat = (float) Setting::get('office_lat', Attendance::OFFICE_LAT);
        $officeLng = (float) Setting::get('office_lng', Attendance::OFFICE_LNG);
        $maxRadius = (float) Setting::get('attendance_radius_meter', Attendance::MAX_RADIUS_METER);

        $distMeter = Attendance::calculateDistance($request->latitude, $request->longitude, $officeLat, $officeLng);

        if ($distMeter > $maxRadius) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => "Posisi Anda berada di luar radius kantor ({$distMeter} meter dari titik kantor). Batas maksimal radius adalah {$maxRadius} meter.",
                'data' => [
                    'distance_meter' => $distMeter,
                    'max_radius' => $maxRadius,
                    'office_lat' => $officeLat,
                    'office_lng' => $officeLng,
                ]
            ], 422);
        }

        // Simpan foto kamera ke WebP (support file upload dan base64)
        if ($request->hasFile('photo')) {
            $photoPath = $this->imageService->convertToWebp($request->file('photo'), 'attendance/checkin', 800, 85);
        } elseif (is_string($request->photo) && str_starts_with($request->photo, 'data:image')) {
            $photoPath = $this->imageService->convertBase64ToWebp($request->photo, 'attendance/checkin', 800, 85);
        } else {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Format foto kamera tidak valid.',
            ], 422);
        }

        // Cek keterlambatan terhadap jam mulai kerja karyawan
        $startTime = Carbon::parse($employee->start_time ?: '08:00:00');
        $currentTime = Carbon::now();
        $isLate = $currentTime->format('H:i:s') > $startTime->format('H:i:s');

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            [
                'check_in_time' => $currentTime->format('H:i:s'),
                'status' => 'Masuk',
                'is_late' => $isLate,
                'check_in_photo' => $photoPath,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'distance_meter' => $distMeter,
            ]
        );

        $msg = $isLate ? 'Absen masuk berhasil (tercatat Terlambat).' : 'Absen masuk berhasil tepat waktu.';

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => $msg,
            'data' => $attendance,
        ]);
    }

    /**
     * Absen Keluar (Check-Out)
     */
    public function checkOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'photo' => 'required',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Profil karyawan tidak ditemukan.'
            ], 422);
        }

        $today = Carbon::today()->toDateString();
        $attendance = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();

        if (!$attendance || !$attendance->check_in_time) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Anda belum melakukan absen masuk hari ini.',
            ], 422);
        }

        if ($attendance->check_out_time) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen keluar pada pukul ' . $attendance->check_out_time,
            ], 422);
        }

        $officeLat = (float) Setting::get('office_lat', Attendance::OFFICE_LAT);
        $officeLng = (float) Setting::get('office_lng', Attendance::OFFICE_LNG);
        $maxRadius = (float) Setting::get('attendance_radius_meter', Attendance::MAX_RADIUS_METER);

        $distMeter = Attendance::calculateDistance($request->latitude, $request->longitude, $officeLat, $officeLng);

        if ($distMeter > $maxRadius) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => "Posisi Anda berada di luar radius kantor ({$distMeter} meter dari titik kantor). Batas maksimal radius adalah {$maxRadius} meter.",
                'data' => [
                    'distance_meter' => $distMeter,
                    'max_radius' => $maxRadius,
                    'office_lat' => $officeLat,
                    'office_lng' => $officeLng,
                ]
            ], 422);
        }

        if ($request->hasFile('photo')) {
            $photoPath = $this->imageService->convertToWebp($request->file('photo'), 'attendance/checkout', 800, 85);
        } elseif (is_string($request->photo) && str_starts_with($request->photo, 'data:image')) {
            $photoPath = $this->imageService->convertBase64ToWebp($request->photo, 'attendance/checkout', 800, 85);
        } else {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Format foto kamera tidak valid.',
            ], 422);
        }

        // Aturan bisnis: Absen keluar sebelum jam akhir kerja -> dianggap Tidak Masuk hari itu, kecuali sedang lembur
        $endTime = Carbon::parse($employee->start_time ?: '17:00:00');
        $currentTime = Carbon::now();
        $isBeforeEndTime = $currentTime->format('H:i:s') < $endTime->format('H:i:s');

        // Cek apakah ada lembur aktif
        $hasActiveOvertime = $employee->overtimes()->where('date', $today)->exists();

        $status = $attendance->status;
        $note = null;
        if ($isBeforeEndTime && !$hasActiveOvertime) {
            $status = 'Tidak Masuk';
            $note = 'Pulang mendahului jam akhir kerja tanpa status lembur aktif.';
        }

        $attendance->update([
            'check_out_time' => $currentTime->format('H:i:s'),
            'status' => $status,
            'check_out_photo' => $photoPath,
            'notes' => $note ?: $attendance->notes,
        ]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Absen keluar berhasil dicatat. Selamat beristirahat!',
            'data' => $attendance,
        ]);
    }

    /**
     * Alias untuk Route: GET /attendance/daily-pdf
     */
    public function downloadDailyPdf(Request $request)
    {
        return $this->downloadPdf($request);
    }

    /**
     * Unduh Laporan PDF Absensi Harian (Section 9.3)
     */
    public function downloadPdf(Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $employees = Employee::with(['user.role', 'position'])->get();

        $records = [];
        foreach ($employees as $emp) {
            $att = Attendance::where('employee_id', $emp->id)->where('date', $date)->first();
            $records[] = [
                'employee' => $emp,
                'status' => $att ? $att->status : 'Tidak Masuk',
                'check_in' => $att ? $att->check_in_time : '-',
                'check_out' => $att ? $att->check_out_time : '-',
                'is_late' => $att ? ($att->is_late ? 'Ya (Terlambat)' : 'Tepat Waktu') : '-',
                'distance' => $att ? ($att->distance_meter . ' m') : '-',
            ];
        }

        $pdf = Pdf::loadView('pdf.attendance', [
            'date' => Carbon::parse($date)->translatedFormat('l, d F Y'),
            'company_name' => Setting::get('company_name', 'Kalebox Percetakan Kemasan'),
            'records' => $records,
        ]);

        return $pdf->download("laporan_absensi_{$date}.pdf");
    }

    /**
     * Input / Catat Presensi Manual oleh Supervisor (Admin, Manager, Owner)
     * Route: POST /api/attendance/manual
     */
    public function storeManual(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|string',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $request->employee_id, 'date' => $request->date],
            [
                'status' => $request->status,
                'check_in_time' => $request->check_in_time ?: ($request->status === 'Masuk' || $request->status === 'Hadir' ? '08:00:00' : null),
                'check_out_time' => $request->check_out_time,
                'is_late' => (bool) $request->get('is_late', false),
                'notes' => $request->notes,
                'distance_meter' => 0,
            ]
        );

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Catatan presensi berhasil disimpan.',
            'data' => $attendance->load(['employee.position.division', 'employee.user']),
        ]);
    }

    /**
     * Perbarui Data Presensi Karyawan oleh Supervisor (Admin, Manager, Owner)
     * Route: PUT /api/attendance/{id}
     */
    public function update(Request $request, $id)
    {
        $attendance = $id instanceof Attendance ? $id : Attendance::findOrFail($id);

        $request->validate([
            'status' => 'required|string',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $attendance->update([
            'status' => $request->status,
            'check_in_time' => $request->check_in_time,
            'check_out_time' => $request->check_out_time,
            'is_late' => (bool) $request->get('is_late', $attendance->is_late),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Status presensi karyawan berhasil diperbarui.',
            'data' => $attendance->load(['employee.position.division', 'employee.user']),
        ]);
    }

    /**
     * Hapus Data Presensi Karyawan
     * Route: DELETE /api/attendance/{id}
     */
    public function destroy($id)
    {
        $attendance = $id instanceof Attendance ? $id : Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data presensi berhasil dihapus.',
        ]);
    }
}
