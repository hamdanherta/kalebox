<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Position;
use App\Models\User;
use App\Services\ImageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        $query = Employee::with(['user.role', 'position.division', 'employeeStatus']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('nik', 'like', '%' . $request->search . '%')
                  ->orWhere('employee_id_number', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('position_id')) {
            $query->where('position_id', $request->position_id);
        }

        $employees = $query->orderBy('name')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $employees,
        ]);
    }

    public function all()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => Employee::with(['user.role', 'position.division'])->orderBy('name')->get(),
        ]);
    }

    public function show($id)
    {
        $employee = $id instanceof Employee ? $id : Employee::findOrFail($id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => $employee->load([
                'user.role',
                'position.division',
                'employeeStatus',
                'attendances' => fn($q) => $q->orderBy('date', 'desc')->limit(30),
                'leaveRequests' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|unique:users,email',
            'position_id' => 'required|exists:positions,id',
        ]);

        // Default email jika tidak diisi
        $email = $request->email;
        if (empty($email)) {
            $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $request->name));
            $email = ($cleanName ?: 'karyawan') . rand(100, 999) . '@kalebox.id';
        }

        // Tentukan Role ID otomatis jika tidak diisi
        $roleId = $request->role_id;
        if (empty($roleId)) {
            $pos = Position::find($request->position_id);
            $posName = strtolower($pos?->name ?? '');
            if (str_contains($posName, 'desain') || str_contains($posName, 'design')) {
                $roleId = 4; // Design
            } elseif (str_contains($posName, 'admin')) {
                $roleId = 3; // Admin
            } else {
                $roleId = 5; // Staff Produksi
            }
        }

        // Hitung gaji harian dari gaji pokok bulanan (standar 25 hari kerja)
        $dailySalary = $request->daily_salary;
        if (empty($dailySalary) && $request->filled('basic_salary')) {
            $dailySalary = round(floatval($request->basic_salary) / 25, 2);
        }
        if (empty($dailySalary)) {
            $dailySalary = 120000; // Rp 3.000.000 / 25
        }

        // NIK KTP (jika tidak diisi buat 16 digit default)
        $nik = $request->nik;
        if (empty($nik) || strlen($nik) !== 16) {
            $nik = '1571' . date('ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        $photoPath = null;
        if ($request->hasFile('profile_photo')) {
            $photoPath = $this->imageService->convertToWebp($request->file('profile_photo'), 'employees', 800, 88);
        }

        $password = $request->filled('password') ? $request->password : 'kalebox123';

        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make($password),
            'role_id' => $roleId,
            'phone' => $request->phone,
            'avatar' => $photoPath,
            'is_active' => true,
        ]);

        $hireDate = $request->get('hire_date', now()->toDateString());
        $years = Carbon::parse($hireDate)->diffInYears(now());
        $employeeIdNumber = '-';
        if ($years >= 1) {
            $yearStr = Carbon::parse($hireDate)->format('Y');
            $employeeIdNumber = "NIK-{$yearStr}-" . str_pad($user->id, 4, '0', STR_PAD_LEFT);
        }

        $employee = Employee::create([
            'user_id' => $user->id,
            'employee_id_number' => $employeeIdNumber,
            'nik' => $nik,
            'name' => $request->name,
            'address' => $request->get('address', 'Kota Jambi'),
            'domicile' => $request->get('domicile', 'Kota Jambi'),
            'position_id' => $request->position_id,
            'employee_status_id' => $request->get('employee_status_id', 1),
            'hire_date' => $hireDate,
            'start_time' => $request->get('start_time', '08:00:00'),
            'end_time' => $request->get('end_time', '17:00:00'),
            'daily_salary' => $dailySalary,
            'profile_photo' => $photoPath,
            'emergency_contact' => $request->emergency_contact,
        ]);

        AuditLog::log('create_employee', 'employees', $employee->id, null, $employee->toArray());

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data karyawan berhasil ditambahkan.',
            'data' => $employee->load(['user.role', 'position.division', 'employeeStatus']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $employee = $id instanceof Employee ? $id : Employee::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'position_id' => 'required|exists:positions,id',
        ]);

        $old = $employee->toArray();

        $photoPath = $employee->profile_photo;
        if ($request->hasFile('profile_photo')) {
            $this->imageService->deleteImage($employee->profile_photo);
            $photoPath = $this->imageService->convertToWebp($request->file('profile_photo'), 'employees', 800, 88);
        }

        // Cek update NIKaryawan jika masa kerja sudah 1 tahun
        $employee->checkAndAssignEmployeeIdNumber();

        $dailySalary = $employee->daily_salary;
        if ($request->filled('basic_salary')) {
            $dailySalary = round(floatval($request->basic_salary) / 25, 2);
        } elseif ($request->filled('daily_salary')) {
            $dailySalary = $request->daily_salary;
        }

        $employee->update([
            'name' => $request->name,
            'nik' => $request->get('nik', $employee->nik),
            'address' => $request->get('address', $employee->address),
            'domicile' => $request->get('domicile', $employee->domicile),
            'position_id' => $request->position_id,
            'employee_status_id' => $request->get('employee_status_id', $employee->employee_status_id),
            'hire_date' => $request->get('hire_date', $employee->hire_date),
            'start_time' => $request->get('start_time', $employee->start_time),
            'end_time' => $request->get('end_time', $employee->end_time),
            'daily_salary' => $dailySalary,
            'profile_photo' => $photoPath,
            'emergency_contact' => $request->get('emergency_contact', $employee->emergency_contact),
        ]);

        $user = $employee->user;
        if ($user) {
            $userUpdate = [
                'name' => $request->name,
                'phone' => $request->phone,
            ];
            if ($request->filled('email') && $request->email !== $user->email) {
                $userUpdate['email'] = $request->email;
            }
            if ($request->filled('password')) {
                $userUpdate['password'] = Hash::make($request->password);
            }
            if ($request->filled('role_id')) {
                $userUpdate['role_id'] = $request->role_id;
            }
            if ($photoPath) {
                $userUpdate['avatar'] = $photoPath;
            }
            $user->update($userUpdate);
        }

        AuditLog::log('update_employee', 'employees', $employee->id, $old, $employee->toArray());

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data karyawan berhasil diperbarui.',
            'data' => $employee->load(['user.role', 'position.division', 'employeeStatus']),
        ]);
    }

    public function destroy($id)
    {
        $employee = $id instanceof Employee ? $id : Employee::findOrFail($id);

        $employee->user?->delete();
        $employee->delete();
        AuditLog::log('delete_employee', 'employees', $employee->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Data karyawan berhasil dihapus.',
        ]);
    }
}
