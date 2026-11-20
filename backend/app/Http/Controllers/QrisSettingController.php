<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\QrisSetting;
use App\Services\ImageService;
use Illuminate\Http\Request;

class QrisSettingController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Endpoint Publik: Ambil QRIS Aktif
     */
    public function getActive()
    {
        $qris = QrisSetting::where('is_active', true)->first();

        return response()->json([
            'success' => true,
            'data' => $qris,
        ]);
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => QrisSetting::orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'account_name' => 'required|string|max:255',
            'qr_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'is_active' => 'boolean',
        ]);

        $imagePath = $this->imageService->convertToWebp($request->file('qr_image'), 'qris', 800, 90);

        if ($request->get('is_active', true)) {
            QrisSetting::where('is_active', true)->update(['is_active' => false]);
        }

        $qris = QrisSetting::create([
            'account_name' => $request->account_name,
            'qr_image' => $imagePath,
            'is_active' => $request->get('is_active', true),
        ]);

        AuditLog::log('create_qris', 'qris_settings', $qris->id);

        return response()->json([
            'success' => true,
            'message' => 'Data QRIS berhasil disimpan.',
            'data' => $qris,
        ], 201);
    }

    public function setActive($qris)
    {
        $qris = $qris instanceof QrisSetting ? $qris : QrisSetting::findOrFail($qris);
        QrisSetting::where('is_active', true)->update(['is_active' => false]);
        $qris->update(['is_active' => true]);

        AuditLog::log('set_active_qris', 'qris_settings', $qris->id);

        return response()->json([
            'success' => true,
            'message' => 'QRIS aktif berhasil diperbarui.',
            'data' => $qris,
        ]);
    }

    public function destroy($qris)
    {
        $qris = $qris instanceof QrisSetting ? $qris : QrisSetting::findOrFail($qris);
        $this->imageService->deleteImage($qris->qr_image);
        $qris->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data QRIS berhasil dihapus.',
        ]);
    }
}
