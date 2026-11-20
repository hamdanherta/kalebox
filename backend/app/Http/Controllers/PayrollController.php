<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Bonus;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Overtime;
use App\Models\Payroll;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->get('month');
        $year  = $request->get('year');

        $query = Payroll::with(['employee.position.division', 'bonus'])
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->orderBy('id', 'desc');

        if ($month) {
            $query->where('period_month', (int)$month);
        }
        if ($year) {
            $query->where('period_year', (int)$year);
        }

        $payrolls = $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $payrolls,
        ]);
    }

    public function show($id)
    {
        $payroll = Payroll::with(['employee.position.division', 'bonus'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $payroll,
        ]);
    }

    /**
     * Hitung Otomatis Gaji Bulan Ini untuk Semua Karyawan
     */
    public function generateMonthly(Request $request)
    {
        return $this->calculate($request);
    }

    public function calculate(Request $request)
    {
        $month = (int)$request->get('month', now()->month);
        $year  = (int)$request->get('year', now()->year);

        $employees = Employee::all();
        $latePenalty = (float) Setting::get('late_penalty_amount', 25000);

        $generated = [];

        foreach ($employees as $emp) {
            // 1. Data kehadiran pada bulan & tahun tersebut (dukung status 'Masuk' dan 'Hadir')
            $attendances = Attendance::where('employee_id', $emp->id)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->get();

            $daysPresent = $attendances->filter(fn($a) => in_array($a->status, ['Masuk', 'Hadir']))->count();
            $daysAbsent  = $attendances->filter(fn($a) => in_array($a->status, ['Tidak Masuk', 'Alpha']))->count();
            $daysPermission = $attendances->where('status', 'Izin')->count();
            $daysSick    = $attendances->where('status', 'Sakit')->count();
            $timesLate   = $attendances->where('is_late', true)->count();

            // 2. Data lembur
            $overtimes = Overtime::where('employee_id', $emp->id)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->get();

            $overtimeHours = (float) $overtimes->sum('duration_hours');
            $overtimeTotal = (float) $overtimes->sum('total_pay');

            // 3. Potongan keterlambatan
            $latePenaltyTotal = $timesLate * $latePenalty;

            // 4. Gaji harian & total gaji pokok
            $dailySalary = floatval($emp->daily_salary);
            if ($dailySalary <= 0 && floatval($emp->basic_salary) > 0) {
                $dailySalary = round(floatval($emp->basic_salary) / 25, 2);
            }
            if ($dailySalary <= 0) {
                $dailySalary = 120000;
            }

            // Jika ada presensi tercatat, kalikan hari masuk; jika belum ada presensi masuk tapi di-generate, beri default 25 hari
            $calcDays = $daysPresent > 0 ? $daysPresent : 25;
            $basicSalaryTotal = $dailySalary * $calcDays;

            // Cek jika sudah ada payroll tersimpan untuk mempertahankan bonus jika pernah diset
            $existing = Payroll::where('employee_id', $emp->id)
                ->where('period_month', $month)
                ->where('period_year', $year)
                ->first();

            $bonusId = $existing?->bonus_id;
            $bonusAmount = (float) ($existing?->bonus_amount ?? 0);

            // Total Bersih = Gaji Dasar - Potongan + Lembur + Bonus
            $netSalary = max(0, $basicSalaryTotal - $latePenaltyTotal + $overtimeTotal + $bonusAmount);

            $payroll = Payroll::updateOrCreate(
                [
                    'employee_id' => $emp->id,
                    'period_month' => $month,
                    'period_year' => $year,
                ],
                [
                    'daily_salary' => $dailySalary,
                    'days_present' => $calcDays,
                    'days_permission' => $daysPermission,
                    'days_sick' => $daysSick,
                    'days_absent' => $daysAbsent,
                    'times_late' => $timesLate,
                    'late_penalty_total' => $latePenaltyTotal,
                    'overtime_hours' => $overtimeHours,
                    'overtime_total' => $overtimeTotal,
                    'bonus_id' => $bonusId,
                    'bonus_amount' => $bonusAmount,
                    'basic_salary_total' => $basicSalaryTotal,
                    'net_salary' => $netSalary,
                    'status' => $existing?->status ?? 'Draft',
                ]
            );

            $generated[] = $payroll->load(['employee.position', 'bonus']);
        }

        AuditLog::log('calculate_payroll', 'payrolls', null, null, ['month' => $month, 'year' => $year]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Perhitungan penggajian periode {$month}/{$year} berhasil diperbarui.",
            'data' => $generated,
        ]);
    }

    /**
     * Tambah Slip Gaji Manual Karyawan
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer',
            'basic_salary_total' => 'required|numeric|min:0',
        ]);

        $basicSalaryTotal = floatval($request->basic_salary_total);
        $latePenaltyTotal = floatval($request->get('late_penalty_total', 0));
        $overtimeTotal = floatval($request->get('overtime_total', 0));
        $bonusAmount = floatval($request->get('bonus_amount', 0));

        $netSalary = max(0, $basicSalaryTotal - $latePenaltyTotal + $overtimeTotal + $bonusAmount);

        $payroll = Payroll::updateOrCreate(
            [
                'employee_id' => $request->employee_id,
                'period_month' => $request->period_month,
                'period_year' => $request->period_year,
            ],
            [
                'daily_salary' => round($basicSalaryTotal / 25, 2),
                'days_present' => intval($request->get('days_present', 25)),
                'days_permission' => intval($request->get('days_permission', 0)),
                'days_sick' => intval($request->get('days_sick', 0)),
                'days_absent' => intval($request->get('days_absent', 0)),
                'times_late' => intval($request->get('times_late', 0)),
                'late_penalty_total' => $latePenaltyTotal,
                'overtime_hours' => floatval($request->get('overtime_hours', 0)),
                'overtime_total' => $overtimeTotal,
                'bonus_id' => $request->bonus_id,
                'bonus_amount' => $bonusAmount,
                'basic_salary_total' => $basicSalaryTotal,
                'net_salary' => $netSalary,
                'status' => $request->get('status', 'Draft'),
            ]
        );

        AuditLog::log('create_payroll', 'payrolls', $payroll->id, null, $payroll->toArray());

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data slip gaji karyawan berhasil disimpan.',
            'data' => $payroll->load(['employee.position.division', 'bonus']),
        ], 201);
    }

    /**
     * Edit / Sesuaikan Komponen Payroll Karyawan
     */
    public function update(Request $request, $id)
    {
        $payroll = $id instanceof Payroll ? $id : Payroll::findOrFail($id);

        $request->validate([
            'basic_salary_total' => 'nullable|numeric|min:0',
            'bonus_amount' => 'nullable|numeric|min:0',
            'overtime_total' => 'nullable|numeric|min:0',
            'late_penalty_total' => 'nullable|numeric|min:0',
        ]);

        $basicSalaryTotal = $request->filled('basic_salary_total') 
            ? floatval($request->basic_salary_total) 
            : floatval($payroll->basic_salary_total);

        $bonusAmount = $request->filled('bonus_amount') 
            ? floatval($request->bonus_amount) 
            : floatval($payroll->bonus_amount);

        $overtimeTotal = $request->filled('overtime_total') 
            ? floatval($request->overtime_total) 
            : floatval($payroll->overtime_total);

        $latePenaltyTotal = $request->filled('late_penalty_total') 
            ? floatval($request->late_penalty_total) 
            : floatval($payroll->late_penalty_total);

        $netSalary = max(0, $basicSalaryTotal - $latePenaltyTotal + $overtimeTotal + $bonusAmount);

        $data = [
            'basic_salary_total' => $basicSalaryTotal,
            'bonus_id' => $request->get('bonus_id', $payroll->bonus_id),
            'bonus_amount' => $bonusAmount,
            'overtime_total' => $overtimeTotal,
            'late_penalty_total' => $latePenaltyTotal,
            'net_salary' => $netSalary,
        ];

        if ($request->filled('days_present')) {
            $data['days_present'] = intval($request->days_present);
        }
        if ($request->filled('status')) {
            $data['status'] = $request->status;
            if ($request->status === 'Dibayar' && !$payroll->paid_at) {
                $data['paid_at'] = now();
            }
        }

        $payroll->update($data);
        AuditLog::log('update_payroll', 'payrolls', $payroll->id, null, $payroll->toArray());

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data penggajian karyawan berhasil diperbarui.',
            'data' => $payroll->load(['employee.position.division', 'bonus']),
        ]);
    }

    public function destroy($id)
    {
        $payroll = $id instanceof Payroll ? $id : Payroll::findOrFail($id);
        $payroll->delete();
        AuditLog::log('delete_payroll', 'payrolls', $payroll->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data slip gaji berhasil dihapus.',
        ]);
    }

    /**
     * Terapkan Bonus Khusus ke Karyawan Tertentu
     */
    public function setBonus(Request $request, $id)
    {
        $payroll = $id instanceof Payroll ? $id : Payroll::findOrFail($id);

        $request->validate([
            'bonus_id' => 'nullable|exists:bonuses,id',
            'custom_amount' => 'nullable|numeric|min:0',
        ]);

        $bonusAmount = 0;
        $bonusId = $request->bonus_id;

        if ($bonusId) {
            $bonus = Bonus::find($bonusId);
            $bonusAmount = $request->filled('custom_amount') ? $request->custom_amount : $bonus->amount;
        }

        $netSalary = max(0, $payroll->basic_salary_total - $payroll->late_penalty_total + $payroll->overtime_total + $bonusAmount);

        $payroll->update([
            'bonus_id' => $bonusId,
            'bonus_amount' => $bonusAmount,
            'net_salary' => $netSalary,
        ]);

        AuditLog::log('set_payroll_bonus', 'payrolls', $payroll->id, null, ['bonus_amount' => $bonusAmount]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Bonus penggajian berhasil diterapkan.',
            'data' => $payroll->load(['employee', 'bonus']),
        ]);
    }

    /**
     * Ubah Status Penggajian (Draft -> Final -> Dibayar)
     */
    public function updateStatus(Request $request, $id)
    {
        $payroll = $id instanceof Payroll ? $id : Payroll::findOrFail($id);

        $statusMap = [
            'draft' => 'Draft',
            'final' => 'Final',
            'paid' => 'Dibayar',
            'dibayar' => 'Dibayar',
            'Draft' => 'Draft',
            'Final' => 'Final',
            'Dibayar' => 'Dibayar',
        ];

        $inputStatus = $request->status;
        $status = $statusMap[$inputStatus] ?? ucfirst($inputStatus);

        $data = ['status' => $status];
        if ($status === 'Dibayar' && !$payroll->paid_at) {
            $data['paid_at'] = now();
        }

        $payroll->update($data);
        AuditLog::log('update_payroll_status', 'payrolls', $payroll->id, null, ['status' => $status]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Status penggajian berhasil diubah menjadi {$status}.",
            'data' => $payroll->load(['employee.position', 'bonus']),
        ]);
    }

    /**
     * Unduh Slip Gaji PDF Resmi
     */
    public function downloadPayslipPdf($id)
    {
        return $this->downloadPayslip($id);
    }

    public function downloadPayslip($id)
    {
        $payroll = $id instanceof Payroll ? $id : Payroll::findOrFail($id);
        $payroll->load(['employee.position.division', 'bonus']);

        $pdf = Pdf::loadView('pdf.payslip', [
            'payroll' => $payroll,
            'employee' => $payroll->employee,
            'company_name' => Setting::get('company_name', 'Kalebox Percetakan Kemasan'),
            'company_address' => Setting::get('company_address', 'Jl. Kolonel Pol. M. Thaher No. 88, Jambi'),
        ]);

        $empName = str_replace(' ', '_', $payroll->employee ? $payroll->employee->name : 'karyawan');
        return $pdf->download("slip_gaji_{$empName}_{$payroll->period_month}_{$payroll->period_year}.pdf");
    }
}
