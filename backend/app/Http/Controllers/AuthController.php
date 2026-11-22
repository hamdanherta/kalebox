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
     * Pendaftaran Karyawan Internal Mandiri dengan Role & Domain Email Khusus
     */
    public function registerInternal(Request $request)
    {
        $roleDomainMap = [
            'owner'    => ['domain' => 'ownerkalebox.id', 'label' => 'Owner', 'pos' => 'Direktur Utama / Owner', 'salary' => 250000],
            'manager'  => ['domain' => 'managerkalebox.id', 'label' => 'Manager', 'pos' => 'Manajer Operasional', 'salary' => 180000],
            'admin'    => ['domain' => 'adminkalebox.id', 'label' => 'Admin', 'pos' => 'Admin & Content Specialist', 'salary' => 120000],
            'design'   => ['domain' => 'desainkalebox.id', 'label' => 'Desain', 'pos' => 'Senior Graphic Designer', 'salary' => 135000],
            'staff'    => ['domain' => 'produksikalebox.id', 'label' => 'Produksi', 'pos' => 'Operator Mesin Cetak & QC', 'salary' => 110000],
            'keuangan' => ['domain' => 'keuangankalebox.id', 'label' => 'Keuangan', 'pos' => 'Staff Keuangan & Kasir', 'salary' => 130000],
        ];

        $allowedRoles = array_keys($roleDomainMap);

        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|in:' . implode(',', $allowedRoles),
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'role.required' => 'Pilihan Role jabatan wajib dipilih.',
            'role.in' => 'Role yang dipilih tidak valid.',
            'password.min' => 'Kata sandi minimal terdiri dari 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email ini sudah terdaftar di sistem.',
        ]);

        $selectedRole = strtolower(trim($request->role));
        $expectedDomain = $roleDomainMap[$selectedRole]['domain'];
        $roleLabel = $roleDomainMap[$selectedRole]['label'];

        // 1. Validasi format email domain khusus role
        $email = strtolower(trim($request->email));
        $emailParts = explode('@', $email);
        $domain = end($emailParts);

        if ($domain !== $expectedDomain) {
            throw ValidationException::withMessages([
                'email' => ["Format email untuk role {$roleLabel} wajib menggunakan akhiran @{$expectedDomain} (contoh: nama@{$expectedDomain})."],
            ]);
        }

        // 2. Validasi batas ketat: Owner (maks 1) dan Manager (maks 1)
        if ($selectedRole === 'owner') {
            $existingOwnerCount = User::whereHas('role', fn($q) => $q->where('name', 'owner'))->count();
            if ($existingOwnerCount >= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Owner sudah terdaftar di sistem. Maksimal hanya diperbolehkan 1 akun Owner.',
                ], 422);
            }
        } elseif ($selectedRole === 'manager') {
            $existingManagerCount = User::whereHas('role', fn($q) => $q->where('name', 'manager'))->count();
            if ($existingManagerCount >= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Manager sudah terdaftar di sistem. Maksimal hanya diperbolehkan 1 akun Manager.',
                ], 422);
            }
        }

        // 3. Ambil atau buat Role Model
        $targetRole = Role::firstOrCreate(['name' => $selectedRole], [
            'display_name' => $roleLabel,
        ]);

        // 4. Buat User
        $user = User::create([
            'name' => trim($request->name),
            'email' => $email,
            'password' => Hash::make($request->password),
            'role_id' => $targetRole->id,
            'phone' => $request->phone ?? '-',
            'is_active' => true,
        ]);

        // 5. Sambungkan ke profil Karyawan
        $position = \App\Models\Position::where('name', 'like', "%" . explode(' ', $roleDomainMap[$selectedRole]['pos'])[0] . "%")->first()
            ?: \App\Models\Position::first();
        $status = \App\Models\EmployeeStatus::where('name', 'like', '%Tetap%')->first()
            ?: \App\Models\EmployeeStatus::first();

        Employee::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'nik' => $request->nik ?? str_pad('1571' . date('ymd') . $user->id, 16, '0', STR_PAD_RIGHT),
            'employee_id_number' => '-',
            'address' => $request->address ?? 'Toko Percetakan Kalebox',
            'domicile' => $request->domicile ?? 'Kota Jambi',
            'position_id' => $position?->id,
            'employee_status_id' => $status?->id,
            'hire_date' => Carbon::now()->toDateString(),
            'daily_salary' => $roleDomainMap[$selectedRole]['salary'],
        ]);

        $token = $user->createToken('kalebox_internal_token')->plainTextToken;

        AuditLog::log('register_internal', 'auth', $user->id, null, ['email' => $user->email, 'role' => $targetRole->name]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Pendaftaran akun ' . $roleLabel . ' berhasil!',
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
