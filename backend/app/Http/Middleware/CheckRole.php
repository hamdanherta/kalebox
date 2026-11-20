<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi autentikasi diperlukan. Silakan login terlebih dahulu.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan oleh administrator.',
            ], 403);
        }

        $userRole = strtolower($user->role?->name ?? '');

        // Petakan angka role (1: Owner, 2: Manager, 3: Admin, 4: Design, 5: Staff, 6: Member) bila dilewatkan angka
        $roleMap = [
            '1' => 'owner',
            '2' => 'manager',
            '3' => 'admin',
            '4' => 'design',
            '5' => 'staff',
            '6' => 'member',
        ];

        $allowedRoles = [];
        foreach ($roles as $r) {
            $lower = strtolower(trim($r));
            if (isset($roleMap[$lower])) {
                $allowedRoles[] = $roleMap[$lower];
            } else {
                $allowedRoles[] = $lower;
            }
        }

        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Peran Anda (' . ($user->role?->display_name ?? 'Tanpa Peran') . ') tidak memiliki izin untuk modul ini.',
            ], 403);
        }

        return $next($request);
    }
}
