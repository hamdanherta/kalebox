<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\PromotionPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PromotionPlatformController extends Controller
{
    /**
     * Display a listing of promotion platforms.
     */
    public function index()
    {
        $platforms = PromotionPlatform::withCount('contents')->orderBy('name')->get();

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => $platforms,
        ]);
    }

    /**
     * Store a newly created promotion platform.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || (!$user->isOwner() && !$user->isManager())) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Akses ditolak. Hanya Owner atau Manager yang memiliki wewenang untuk menambahkan platform media sosial.',
            ], 403);
        }

        $request->validate([
            'name'         => 'required|string|max:255',
            'logo'         => 'nullable|file|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'account_link' => 'nullable|string|max:255',
        ], [
            'name.required' => 'Nama platform wajib diisi.',
            'logo.max'      => 'Ukuran file logo maksimal 2 MB.',
            'logo.mimes'    => 'Format logo harus berupa file PNG, JPG, WEBP, atau SVG.',
        ]);

        $accountLink = $request->input('account_link');
        if ($accountLink && !str_starts_with($accountLink, 'http://') && !str_starts_with($accountLink, 'https://')) {
            $accountLink = 'https://' . ltrim($accountLink, '/');
        }

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $ext = $file->getClientOriginalExtension();
            $filename = 'platform_' . Str::random(16) . '.' . $ext;
            $path = $file->storeAs('platforms', $filename, 'public');
            $logoPath = '/storage/' . $path;
        }

        $platform = PromotionPlatform::create([
            'name'         => $request->name,
            'logo'         => $logoPath,
            'account_link' => $accountLink,
        ]);

        AuditLog::log('create_platform', 'promotion_platforms', $platform->id, null, [
            'name' => $platform->name,
            'account_link' => $platform->account_link,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Platform promosi berhasil ditambahkan.',
            'data'    => $platform,
        ], 201);
    }

    /**
     * Display the specified platform.
     */
    public function show(PromotionPlatform $promotionPlatform)
    {
        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => $promotionPlatform->loadCount('contents'),
        ]);
    }

    /**
     * Update the specified platform.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isOwner() && !$user->isManager())) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Akses ditolak. Hanya Owner atau Manager yang memiliki wewenang untuk mengubah data platform media sosial.',
            ], 403);
        }

        $platform = PromotionPlatform::findOrFail($id);

        $request->validate([
            'name'         => 'required|string|max:255',
            'logo'         => 'nullable|file|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'account_link' => 'nullable|string|max:255',
        ], [
            'name.required' => 'Nama platform wajib diisi.',
            'logo.max'      => 'Ukuran file logo maksimal 2 MB.',
            'logo.mimes'    => 'Format logo harus berupa file PNG, JPG, WEBP, atau SVG.',
        ]);

        $accountLink = $request->input('account_link');
        if ($accountLink && !str_starts_with($accountLink, 'http://') && !str_starts_with($accountLink, 'https://')) {
            $accountLink = 'https://' . ltrim($accountLink, '/');
        }

        $data = [
            'name'         => $request->name,
            'account_link' => $accountLink,
        ];

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $ext = $file->getClientOriginalExtension();
            $filename = 'platform_' . Str::random(16) . '.' . $ext;
            $path = $file->storeAs('platforms', $filename, 'public');
            $data['logo'] = '/storage/' . $path;
        }

        $platform->update($data);
        AuditLog::log('update_platform', 'promotion_platforms', $platform->id, null, $data);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Platform promosi berhasil diperbarui.',
            'data'    => $platform->fresh()->loadCount('contents'),
        ]);
    }

    /**
     * Remove the specified platform.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isOwner() && !$user->isManager())) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Akses ditolak. Hanya Owner atau Manager yang memiliki wewenang untuk menghapus platform media sosial.',
            ], 403);
        }

        $platform = PromotionPlatform::withCount('contents')->findOrFail($id);

        if ($platform->contents_count > 0) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => "Tidak dapat menghapus platform '{$platform->name}' karena masih memiliki {$platform->contents_count} konten promosi terkait.",
            ], 422);
        }

        $platform->delete();
        AuditLog::log('delete_platform', 'promotion_platforms', $id);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Platform promosi berhasil dihapus.',
        ]);
    }
}
