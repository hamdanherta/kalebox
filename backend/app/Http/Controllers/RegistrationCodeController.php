<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\RegistrationCode;
use App\Models\Role;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RegistrationCodeController extends Controller
{
    public function index()
    {
        $codes = RegistrationCode::with(['role', 'creator', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $codes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
            'expires_days' => 'nullable|integer|min:1|max:90',
        ]);

        $role = Role::findOrFail($request->role_id);
        if ($role->name === 'member') {
            return response()->json([
                'success' => false,
                'message' => 'Kode registrasi hanya untuk peran karyawan (Role 1-5).',
            ], 422);
        }

        $code = 'KLB-' . strtoupper($role->name) . '-' . strtoupper(Str::random(6));

        $regCode = RegistrationCode::create([
            'code' => $code,
            'role_id' => $role->id,
            'created_by' => auth()->id(),
            'is_used' => false,
            'expires_at' => Carbon::now()->addDays($request->get('expires_days', 30)),
        ]);

        AuditLog::log('create_registration_code', 'auth', $regCode->id, null, ['code' => $code, 'role' => $role->name]);

        return response()->json([
            'success' => true,
            'message' => 'Kode undangan karyawan berhasil dibuat.',
            'data' => $regCode->load('role'),
        ], 201);
    }

    public function destroy($code)
    {
        $code = $code instanceof RegistrationCode ? $code : RegistrationCode::findOrFail($code);
        $code->delete();
        return response()->json([
            'success' => true,
            'message' => 'Kode undangan berhasil dihapus.',
        ]);
    }
}
