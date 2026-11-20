<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Member;
use App\Models\RegistrationCode;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login Karyawan Internal (Role 1-5)
     */
    public function loginInternal(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with(['role', 'employee.position', 'employee.employeeStatus'])
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kombinasi email dan kata sandi tidak cocok.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi Owner atau Manager.',
            ], 403);
        }

        if ($user->role?->name === 'member') {
            return response()->json([
                'success' => false,
                'message' => 'Halaman ini khusus login karyawan internal. Untuk pelanggan/member, silakan gunakan halaman Masuk Member.',
            ], 403);
        }

        $token = $user->createToken('kalebox_internal_token')->plainTextToken;

        AuditLog::log('login_internal', 'auth', $user->id, null, ['user_id' => $user->id, 'role' => $user->role?->name]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Login berhasil. Selamat datang kembali, ' . $user->name . '!',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Pendaftaran Karyawan Internal (Membutuhkan Kode Undangan Resmi)
     */
    public function registerInternal(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:20',
            'nik' => 'required|string|size:16',
            'address' => 'required|string',
            'domicile' => 'required|string',
            'position_id' => 'required|exists:positions,id',
            'employee_status_id' => 'required|exists:employee_statuses,id',
        ], [
            'nik.size' => 'NIK KTP wajib terdiri dari 16 digit angka.',
            'password.min' => 'Kata sandi minimal terdiri dari 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'email.unique' => 'Alamat email ini sudah terdaftar.',
        ]);

        $regCode = RegistrationCode::with('role')
            ->where('code', trim($request->code))
            ->first();

        if (!$regCode) {
            return response()->json([
                'success' => false,
                'message' => 'Kode registrasi/undangan karyawan tidak valid.',
            ], 422);
        }

        if ($regCode->is_used) {
            return response()->json([
                'success' => false,
                'message' => 'Kode registrasi ini sudah pernah digunakan.',
            ], 422);
        }

        if ($regCode->expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode registrasi ini telah kadaluarsa.',
            ], 422);
        }

        $targetRole = $regCode->role;

        // Validasi batas ketat Owner (1) dan Manager (1)
        if ($targetRole->name === 'owner') {
            $existingOwnerCount = User::whereHas('role', fn($q) => $q->where('name', 'owner'))->count();
            if ($existingOwnerCount >= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Batas maksimal Owner (1 orang) sudah tercapai di sistem.',
                ], 422);
            }
        } elseif ($targetRole->name === 'manager') {
            $existingManagerCount = User::whereHas('role', fn($q) => $q->where('name', 'manager'))->count();
            if ($existingManagerCount >= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Batas maksimal Manager (1 orang) sudah tercapai di sistem.',
                ], 422);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $targetRole->id,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        $employee = Employee::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'nik' => $request->nik,
            'employee_id_number' => '-',
            'address' => $request->address,
            'domicile' => $request->domicile,
            'position_id' => $request->position_id,
            'employee_status_id' => $request->employee_status_id,
            'hire_date' => Carbon::now()->toDateString(),
            'daily_salary' => 120000,
        ]);

        // Tandai kode undangan sebagai terpakai
        $regCode->update([
            'is_used' => true,
            'used_by' => $user->id,
        ]);

        $token = $user->createToken('kalebox_internal_token')->plainTextToken;

        AuditLog::log('register_internal', 'auth', $user->id, null, ['email' => $user->email, 'role' => $targetRole->name]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Pendaftaran akun karyawan berhasil.',
            'data' => [
                'user' => $user->load(['role', 'employee.position', 'employee.employeeStatus']),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login Member Pelanggan
     */
    public function loginMember(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with(['role', 'member'])
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kombinasi email dan kata sandi member tidak cocok.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun member Anda dinonaktifkan.',
            ], 403);
        }

        $token = $user->createToken('kalebox_member_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Login member berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Pendaftaran Member Mandiri dari Halaman Publik
     */
    public function registerMember(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
        ]);

        $memberRole = Role::where('name', 'member')->firstOrFail();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $memberRole->id,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        $member = Member::create([
            'member_no' => Member::generateMemberNo(),
            'user_id' => $user->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'discount_percent' => 5.00,
        ]);

        $token = $user->createToken('kalebox_member_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Pendaftaran Member berhasil. Selamat bergabung di Kalebox!',
            'data' => [
                'user' => $user->load(['role', 'member']),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Profil Pengguna Aktif
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['role', 'employee.position.division', 'employee.employeeStatus', 'member']);
        $unreadNotificationsCount = $user->notifications()->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => [
                'user' => $user,
                'unread_notifications' => $unreadNotificationsCount,
            ],
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Anda telah berhasil keluar (logout).',
        ]);
    }

    /**
     * Ubah Kata Sandi
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini tidak cocok.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        AuditLog::log('change_password', 'auth', $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
