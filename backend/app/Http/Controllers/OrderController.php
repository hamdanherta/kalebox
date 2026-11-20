<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\FinanceTransaction;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDesign;
use App\Models\OrderRevision;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\QrisSetting;
use App\Models\Setting;
use App\Models\User;
use App\Services\ImageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Checkout Pesanan Publik dari Website (Tanpa Login / Dengan Login Member)
     */
    public function publicStore(Request $request)
    {
        // Support alias fields from different frontend clients
        if (!$request->has('name') && $request->has('client_name')) {
            $request->merge(['name' => $request->client_name]);
        }
        if (!$request->has('phone') && $request->has('client_phone')) {
            $request->merge(['phone' => $request->client_phone]);
        }
        if (!$request->has('email') && $request->has('client_email')) {
            $request->merge(['email' => $request->client_email]);
        }
        if (!$request->has('handover_type')) {
            $request->merge(['handover_type' => 'Ambil Sendiri']);
        }
        if (!$request->filled('shipping_address')) {
            $request->merge(['shipping_address' => 'Alamat Pelanggan / Ambil di Toko']);
        }
        if (!$request->has('delivery_date')) {
            $request->merge(['delivery_date' => Carbon::today()->addDays(7)->toDateString()]);
        }
        $pm = strtolower((string)$request->input('payment_method', ''));
        if (in_array($pm, ['cash', 'tunai', 'transfer', 'qris', 'lunas'])) {
            $request->merge(['payment_method' => 'Lunas']);
        } elseif (in_array($pm, ['dp', 'down payment'])) {
            $request->merge(['payment_method' => 'DP']);
        } elseif (!$request->filled('payment_method')) {
            $request->merge(['payment_method' => 'Lunas']);
        }
        if (!$request->has('design_file_type')) {
            $request->merge(['design_file_type' => 'File Baru']);
        }

        $minDate = Carbon::today()->addDays(3)->toDateString();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:255',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'finishing_id' => 'nullable|exists:finishings,id',
            'cutting_id' => 'nullable|exists:cuttings,id',
            'handover_type' => 'required|in:Ambil Sendiri,Dikirim',
            'shipping_address' => 'nullable|required_if:handover_type,Dikirim|string',
            'delivery_date' => 'required|date|after_or_equal:' . $minDate,
            'payment_method' => 'required|in:DP,Belum Dibayar,Lunas',
            'notes' => 'nullable|string',
            'design_file_type' => 'required|in:File Lama,File Baru',
            'design_file' => 'nullable|file|max:25600', // max 25MB
        ], [
            'delivery_date.after_or_equal' => 'Estimasi tanggal pengambilan atau pengiriman minimal 3 hari dari hari ini.',
        ]);

        $product = Product::with(['category', 'material'])->findOrFail($request->product_id);

        if ($request->quantity < $product->min_order) {
            return response()->json([
                'success' => false,
                'message' => "Jumlah pesanan ({$request->quantity}) kurang dari minimal order produk ({$product->min_order} pcs).",
            ], 422);
        }

        // 1. Sinkronisasi Data Klien (Sesuai aturan ketat Section 7.7)
        $client = Client::findOrCreateFromOrder($request->name, $request->phone, $request->email);

        // 2. Cek apakah ada Member Login untuk diskon otomatis
        $memberId = null;
        $discountPercent = 0.0;

        if ($request->user() && $request->user()->isMember()) {
            $member = $request->user()->member;
            if ($member) {
                $memberId = $member->id;
                $discountPercent = (float) $member->discount_percent;
                $client->update(['is_member' => true]);
            }
        }

        // 3. Perhitungan Harga
        $unitPrice = (float) $product->unit_price;
        $subtotal = $unitPrice * $request->quantity;
        $discountAmount = $subtotal * ($discountPercent / 100);
        $totalPrice = max(0, $subtotal - $discountAmount);

        // 4. Pembayaran & Timer QRIS 5 Menit
        $paidAmount = 0;
        $paymentStatus = 'Belum Dibayar';
        $expiresAt = null;

        if ($request->payment_method === 'DP') {
            $paymentStatus = 'Menunggu Pembayaran DP';
            $expiresAt = Carbon::now()->addMinutes(5);
        } elseif ($request->payment_method === 'Lunas') {
            $paymentStatus = 'Menunggu Pembayaran Lunas';
            $expiresAt = Carbon::now()->addMinutes(5);
        }

        // 5. Upload File Desain jika ada
        $designFilePath = null;
        if ($request->hasFile('design_file')) {
            $file = $request->file('design_file');
            $ext = $file->getClientOriginalExtension();
            $fname = Str::random(32) . '.' . $ext;
            $designFilePath = '/storage/' . $file->storeAs('orders/design_files', $fname, 'public');
        }

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'tracking_token' => Order::generateTrackingToken(),
            'client_id' => $client->id,
            'member_id' => $memberId,
            'customer_name' => trim($request->name),
            'customer_phone' => Client::normalizePhone($request->phone),
            'customer_email' => $request->email ? strtolower(trim($request->email)) : null,
            'is_new_customer' => ($client->client_type === 'Baru'),
            'product_id' => $product->id,
            'category_id' => $product->category_id,
            'finishing_id' => $request->finishing_id,
            'cutting_id' => $request->cutting_id,
            'design_file_type' => $request->design_file_type,
            'design_file_path' => $designFilePath,
            'quantity' => $request->quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'total_price' => $totalPrice,
            'paid_amount' => 0,
            'remaining_amount' => $totalPrice,
            'payment_method' => $request->payment_method,
            'payment_status' => $paymentStatus,
            'payment_expires_at' => $expiresAt,
            'handover_type' => $request->handover_type,
            'shipping_address' => $request->shipping_address,
            'delivery_date' => $request->delivery_date,
            'notes' => $request->notes,
            'status' => Order::STATUS_MASUK,
            'deadline' => Carbon::parse($request->delivery_date)->setTime(17, 0, 0),
        ]);

        // Catat riwayat status pertama
        $order->statusHistories()->create([
            'status' => Order::STATUS_MASUK,
            'notes' => 'Pesanan berhasil dibuat secara online dari website.',
        ]);

        // Notifikasi ke Admin & Manager
        $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
        foreach ($admins as $adm) {
            Notification::create([
                'user_id' => $adm->id,
                'title' => 'Pesanan Masuk Baru',
                'message' => "Pesanan baru #{$order->order_number} dari {$order->customer_name} ({$order->quantity} pcs).",
                'type' => 'new_order',
                'reference_id' => $order->id,
                'reference_type' => 'order',
            ]);
        }

        AuditLog::log('public_create_order', 'orders', $order->id, null, [
            'order_number' => $order->order_number,
            'customer' => $order->customer_name,
            'total' => $order->total_price,
        ]);

        $activeQris = QrisSetting::getActive();

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Pesanan berhasil dibuat!',
            'data' => [
                'order' => $order->load(['product', 'category', 'finishing', 'cutting']),
                'tracking_token' => $order->tracking_token,
                'tracking_url' => "/pesanan/{$order->tracking_token}",
                'qris' => $activeQris,
            ],
        ], 201);
    }

    /**
     * Endpoint Publik: Pantau Pesanan & Hasil Desain (Tanpa Login)
     */
    public function publicTrack($token)
    {
        $order = Order::with([
            'client',
            'product.material',
            'category',
            'finishing',
            'cutting',
            'designer',
            'staff',
            'statusHistories' => fn($q) => $q->orderBy('created_at', 'asc'),
            'designs' => fn($q) => $q->orderBy('version_number', 'desc'),
            'revisions.design',
        ])
        ->where('tracking_token', $token)
        ->firstOrFail();

        $activeQris = QrisSetting::getActive();

        // Hitung sisa waktu pembayaran QRIS (dalam detik)
        $remainingSeconds = 0;
        $isExpired = false;

        if ($order->payment_expires_at) {
            if ($order->payment_expires_at->isFuture()) {
                $remainingSeconds = now()->diffInSeconds($order->payment_expires_at);
            } else {
                $isExpired = true;
                if (in_array($order->payment_status, ['Menunggu Pembayaran DP', 'Menunggu Pembayaran Lunas'])) {
                    $order->update(['payment_status' => 'Kadaluarsa']);
                }
            }
        }

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'data' => [
                'order' => $order,
                'qris' => $activeQris,
                'tracking_token' => $order->tracking_token,
                'tracking_url' => "/pesanan/{$order->tracking_token}",
                'payment_timer' => [
                    'remaining_seconds' => $remainingSeconds,
                    'is_expired' => $isExpired,
                ],
            ],
        ]);
    }

    /**
     * Upload Bukti Pembayaran / Konfirmasi Pembayaran Klien
     */
    public function publicPaymentProof(Request $request, $token)
    {
        $order = Order::where('tracking_token', $token)->firstOrFail();

        $file = $request->file('proof') ?: $request->file('payment_proof');

        if (!$file && !$request->has('proof') && !$request->has('payment_proof')) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'File bukti transfer pembayaran wajib dipilih.',
            ], 422);
        }

        $proofPath = null;
        if ($file) {
            $proofPath = $this->imageService->convertToWebp($file, 'orders/payment_proofs', 1200, 88);
        }

        $order->update([
            'payment_proof' => $proofPath ?: $order->payment_proof,
            'payment_status' => 'Menunggu Verifikasi',
        ]);

        $order->addStatusHistory(
            $order->status,
            'Klien mengunggah bukti transfer pembayaran via pelacak pesanan. Menunggu verifikasi tim keuangan/admin.'
        );

        // Notifikasi ke Admin
        $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
        foreach ($admins as $adm) {
            Notification::create([
                'user_id' => $adm->id,
                'title' => 'Pembayaran Perlu Verifikasi',
                'message' => "Klien {$order->customer_name} telah mengunggah bukti pembayaran untuk pesanan #{$order->order_number}.",
                'type' => 'payment_verification',
                'reference_id' => $order->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Konfirmasi pembayaran berhasil dikirim. Admin akan segera memverifikasi.',
            'data' => $order,
        ]);
    }

    /**
     * Klien Melakukan Review Desain (Tombol "Oke" atau "Belum Pas" - Section 8.3 & 8.5)
     */
    public function publicReview(Request $request, $token)
    {
        $order = Order::with('designs')->where('tracking_token', $token)->firstOrFail();

        // Normalisasi decision/action
        $decisionRaw = $request->input('decision') ?: $request->input('action');
        $decision = 'Oke';
        if (in_array(strtolower((string)$decisionRaw), ['belum pas', 'revision', 'revisi', 'reject', 'belumpas'])) {
            $decision = 'Belum Pas';
        }

        $revisionNotes = $request->input('revision_notes') ?: $request->input('notes');

        if ($decision === 'Belum Pas' && empty(trim((string)$revisionNotes))) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Catatan revisi wajib diisi jika desain belum pas.',
            ], 422);
        }

        $latestDesign = $order->designs()->orderBy('version_number', 'desc')->first();

        if ($decision === 'Oke') {
            // Desain Disetujui Klien
            if ($latestDesign) {
                $latestDesign->update(['status' => 'disetujui']);
            }

            $order->addStatusHistory(
                $order->status,
                'Klien menyetujui hasil desain (Oke). Desain resmi di-ACC dan siap diproses ke tahap cetak offset.'
            );

            // Notifikasi langsung ke Desainer & Admin
            if ($order->designer_id) {
                Notification::create([
                    'user_id' => $order->designer_id,
                    'title' => 'Desain Disetujui Klien (ACC)',
                    'message' => "Klien telah menyetujui (ACC) desain pesanan #{$order->order_number}.",
                    'type' => 'design_approved',
                    'reference_id' => $order->id,
                ]);
            }

            $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
            foreach ($admins as $adm) {
                Notification::create([
                    'user_id' => $adm->id,
                    'title' => 'Desain Disetujui Klien (ACC)',
                    'message' => "Desain pesanan #{$order->order_number} sudah di-ACC klien dan siap masuk antrean cetak.",
                    'type' => 'design_ready_to_print',
                    'reference_id' => $order->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'status'  => 'success',
                'message' => 'Terima kasih! Persetujuan desain Anda (ACC) berhasil dicatat.',
                'data' => $order->fresh(['designs', 'revisions', 'statusHistories']),
            ]);
        } else {
            // Klien Minta Revisi ("Belum Pas")
            $refFile = $request->file('reference_image') ?: $request->file('image');
            $refPath = null;
            if ($refFile) {
                $refPath = $this->imageService->convertToWebp($refFile, 'orders/revisions', 1200, 85);
            }

            if ($latestDesign) {
                $latestDesign->update(['status' => 'perlu_revisi']);
            }

            $revision = OrderRevision::create([
                'order_id' => $order->id,
                'order_design_id' => $latestDesign?->id,
                'revision_notes' => $revisionNotes,
                'reference_image' => $refPath,
                'status' => 'menunggu_tindakan',
            ]);

            // Status pesanan beralih ke: Pesanan Sedang Revisi
            $order->update(['status' => Order::STATUS_REVISI]);
            $order->addStatusHistory(
                Order::STATUS_REVISI,
                'Klien meminta revisi desain: ' . $revisionNotes
            );

            // Muncul di dasbor Admin dan diteruskan ke Desainer
            $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
            foreach ($admins as $adm) {
                Notification::create([
                    'user_id' => $adm->id,
                    'title' => 'Permintaan Revisi Desain',
                    'message' => "Klien pesanan #{$order->order_number} meminta revisi: {$revisionNotes}",
                    'type' => 'revision_requested',
                    'reference_id' => $order->id,
                ]);
            }

            if ($order->designer_id) {
                Notification::create([
                    'user_id' => $order->designer_id,
                    'title' => 'Tugas Revisi Masuk',
                    'message' => "Ada catatan revisi baru untuk pesanan #{$order->order_number}: {$revisionNotes}",
                    'type' => 'revision_requested',
                    'reference_id' => $order->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'status'  => 'success',
                'message' => 'Catatan revisian berhasil dikirim. Tim desainer Kalebox akan segera memperbarui desain Anda.',
                'data' => $order->fresh(['designs', 'revisions', 'statusHistories']),
            ]);
        }
    }

    /**
     * Endpoint Internal: Daftar Pesanan (Role 3, 2, 1)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Order::with(['client', 'product', 'category', 'designer', 'staff', 'finishing', 'cutting']);

        // Jika login sebagai Desain (Role 4): hanya melihat pesanan miliknya
        if ($user->isDesign()) {
            $query->where('designer_id', $user->id);
        }
        // Jika login sebagai Staff Produksi (Role 5): hanya melihat pesanan yang ditugaskan ke dirinya
        elseif ($user->isStaff()) {
            $query->where('staff_id', $user->id);
        }

        // Pencarian
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        // Filter Status Pesanan
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter Pembayaran
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter Prioritas
        if ($request->filled('is_high_priority')) {
            $query->where('is_high_priority', filter_var($request->is_high_priority, FILTER_VALIDATE_BOOLEAN));
        }

        // Filter Desainer
        if ($request->filled('designer_id')) {
            $query->where('designer_id', $request->designer_id);
        }

        $perPage = $request->get('per_page', 15);
        $orders = $query->orderBy('is_high_priority', 'desc')
                        ->orderBy('created_at', 'desc')
                        ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Detail Pesanan Internal
     */
    public function show(Order $order)
    {
        return response()->json([
            'success' => true,
            'data' => $order->load([
                'client',
                'product',
                'category',
                'finishing',
                'cutting',
                'designer',
                'staff',
                'vendor',
                'statusHistories.user',
                'designs.designer',
                'revisions',
            ]),
        ]);
    }

    /**
     * Penugasan Desain dan Produksi oleh Admin (Section 8.5)
     */
    public function assignTeam(Request $request, $order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);

        $request->validate([
            'designer_id' => 'required|exists:users,id',
            'staff_id' => 'required|exists:users,id',
            'is_high_priority' => 'boolean',
        ]);

        $order->update([
            'designer_id' => $request->designer_id,
            'staff_id' => $request->staff_id,
            'is_high_priority' => $request->get('is_high_priority', $order->is_high_priority),
            'status' => Order::STATUS_DITERIMA,
        ]);

        $order->addStatusHistory(
            Order::STATUS_DITERIMA,
            'Admin telah menugaskan Desainer dan Tim Produksi.',
            auth()->id()
        );

        // Notifikasi ke Desainer
        Notification::create([
            'user_id' => $request->designer_id,
            'title' => 'Tugas Desain Baru',
            'message' => "Anda ditugaskan mengerjakan desain pesanan #{$order->order_number}." . ($order->is_high_priority ? ' [PRIORITAS TINGGI]' : ''),
            'type' => 'design_assignment',
            'reference_id' => $order->id,
        ]);

        // Notifikasi ke Staff
        Notification::create([
            'user_id' => $request->staff_id,
            'title' => 'Penugasan Produksi Baru',
            'message' => "Pesanan #{$order->order_number} ditugaskan kepada Anda untuk tahap produksi setelah desain selesai.",
            'type' => 'production_assignment',
            'reference_id' => $order->id,
        ]);

        AuditLog::log('assign_order_team', 'orders', $order->id, null, [
            'designer_id' => $request->designer_id,
            'staff_id' => $request->staff_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penugasan Desainer dan Tim Produksi berhasil disimpan.',
            'data' => $order->load(['designer', 'staff']),
        ]);
    }

    /**
     * Langkah 3: Desainer mulai mengerjakan pesanan (Pesanan Diterima -> Pesanan Diproses)
     */
    public function startWork(Request $request, $id)
    {
        $order = $id instanceof Order ? $id : Order::findOrFail($id);
        $user = $request->user();

        // Cek otorisasi desainer atau admin/owner/manager
        if (!$user->isOwner() && !$user->isManager() && !$user->isAdmin() && $order->designer_id !== $user->id) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Hanya desainer yang ditugaskan atau pimpinan yang dapat memulai pengerjaan pesanan ini.',
            ], 403);
        }

        $order->update([
            'status' => Order::STATUS_DIPROSES,
        ]);

        $order->addStatusHistory(
            Order::STATUS_DIPROSES,
            "Desainer ({$user->name}) mulai mengerjakan desain kemasan.",
            $user->id
        );

        AuditLog::log('start_work_order', 'orders', $order->id, null, ['designer' => $user->name]);

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Pesanan berhasil masuk ke tahap proses desain!',
            'data'    => $order->fresh(['designer', 'staff', 'designs', 'revisions', 'statusHistories']),
        ]);
    }

    /**
     * Desainer Mengajukan Desain ke Admin (Section 8.5 Langkah 3)
     * Mendukung upload file fisik ATAU tautan link desain (Drive, Figma, Canva, dll)
     */
    public function submitDesign(Request $request, $order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);

        if (!$request->filled('link') && $request->filled('design_file_url')) {
            $request->merge(['link' => $request->design_file_url]);
        }
        if (!$request->filled('result_url') && $request->filled('design_preview_url')) {
            $request->merge(['result_url' => $request->design_preview_url]);
        }
        if (!$request->filled('notes') && $request->filled('designer_notes')) {
            $request->merge(['notes' => $request->designer_notes]);
        }

        $hasLink = $request->filled('link') || $request->filled('design_link') || $request->filled('result_url') || $request->filled('result_link') || $request->filled('design_file_url') || $request->filled('design_preview_url');

        $request->validate([
            'preview_image' => $hasLink ? 'nullable' : 'required_without:link,design_link,result_url,result_link,design_file_url,design_preview_url',
            'file_master'   => 'nullable|file|max:51200', // max 50MB
            'design_link'   => 'nullable|string',
            'link'          => 'nullable|string',
            'result_url'    => 'nullable|string',
            'result_link'   => 'nullable|string',
            'design_file_url' => 'nullable|string',
            'design_preview_url' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        $previewPath = $request->input('design_preview_url') ?? $request->input('preview_url');
        if ($request->hasFile('preview_image')) {
            $previewPath = $this->imageService->convertToWebp($request->file('preview_image'), 'orders/designs', 1600, 88);
        }

        $filePath = null;
        if ($request->hasFile('file_master')) {
            $file = $request->file('file_master');
            $ext = $file->getClientOriginalExtension();
            $fname = Str::random(32) . '.' . $ext;
            $filePath = '/storage/' . $file->storeAs('orders/masters', $fname, 'public');
        } elseif ($hasLink) {
            $filePath = $request->input('link') ?? $request->input('design_link') ?? $request->input('result_url') ?? $request->input('result_link') ?? $request->input('design_file_url');
        }

        $nextVersion = $order->designs()->count() + 1;

        $design = OrderDesign::create([
            'order_id'       => $order->id,
            'designer_id'    => auth()->id() ?: $order->designer_id,
            'version_number' => $nextVersion,
            'file_path'      => $filePath,
            'preview_image'  => $previewPath,
            'notes'          => $request->notes,
            'status'         => 'diajukan_ke_admin',
        ]);

        $order->status = Order::STATUS_DIPROSES;
        $order->save();

        $order->addStatusHistory(
            Order::STATUS_DIPROSES,
            "Desainer mengajukan desain Versi {$nextVersion} ke Admin" . ($filePath ? " (Link: {$filePath})" : "") . ($request->notes ? " - Catatan: {$request->notes}" : ""),
            auth()->id()
        );

        // Notifikasi ke Admin
        $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
        foreach ($admins as $adm) {
            Notification::create([
                'user_id'      => $adm->id,
                'title'        => 'Desain Diajukan',
                'message'      => "Desainer telah mengajukan desain V{$nextVersion} untuk pesanan #{$order->order_number}. Siap diperiksa dan dibagikan ke klien.",
                'type'         => 'design_submitted',
                'reference_id' => $order->id,
            ]);
        }

        AuditLog::log('submit_design', 'orders', $order->id, null, ['version' => $nextVersion, 'file' => $filePath]);

        return response()->json([
            'success' => true,
            'message' => "Hasil desain Versi {$nextVersion} berhasil diajukan.",
            'data'    => $design,
        ]);
    }

    /**
     * Langkah 8: Admin meneruskan revisi dari Klien ke Desainer (Admin -> Desain)
     */
    public function forwardRevisionToDesigner(Request $request, $id)
    {
        $order = Order::with(['designer', 'revisions'])->findOrFail($id);
        $user = $request->user();

        $revision = $order->revisions()->where('status', 'menunggu_admin')->latest()->first() 
            ?: $order->revisions()->latest()->first();

        $extraNotes = $request->input('notes');
        $notesCombined = $revision ? $revision->revision_notes : 'Permintaan revisi dari klien.';
        if ($extraNotes) {
            $notesCombined .= " (Catatan Tambahan Admin: {$extraNotes})";
        }

        if ($revision) {
            $revision->update(['status' => 'diteruskan_ke_desainer']);
        }

        $order->update(['status' => Order::STATUS_REVISI]);

        $order->addStatusHistory(
            Order::STATUS_REVISI,
            "Admin meneruskan catatan revisi ke Desainer: {$notesCombined}",
            $user->id
        );

        if ($order->designer_id) {
            Notification::create([
                'user_id'      => $order->designer_id,
                'title'        => 'Tugas Revisi dari Admin',
                'message'      => "Pesanan #{$order->order_number} memerlukan revisi: {$notesCombined}",
                'type'         => 'design_revision_assigned',
                'reference_id' => $order->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Catatan revisi berhasil diteruskan ke Desainer.',
            'data'    => $order->load(['designer', 'revisions.design']),
        ]);
    }

    /**
     * Langkah 5 & 10: Admin memeriksa hasil desain dan membagikan link review ke klien (Admin -> Klien)
     */
    public function sendDesignToClient(Request $request, $id)
    {
        $order = Order::with('designs')->findOrFail($id);
        $user = $request->user();

        $latestDesign = $order->designs()->orderBy('version_number', 'desc')->first();
        if ($latestDesign && $latestDesign->status === 'diajukan_ke_admin') {
            $latestDesign->update(['status' => 'dikirim_ke_klien']);
        }

        $order->addStatusHistory(
            $order->status,
            "Admin memeriksa hasil desain dan membagikan link review ke Klien via WhatsApp (V{$latestDesign?->version_number}).",
            $user->id
        );

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Tautan review desain telah disiapkan dan dikirimkan ke Klien.',
            'data'    => $order->load('designs'),
        ]);
    }

    /**
     * Admin Naik Cetak ke Vendor (Section 8.5 Langkah 11)
     */
    public function sendToPrint(Request $request, $order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);

        $vendorId = $request->input('vendor_id') ?: \App\Models\Vendor::first()?->id;
        $request->merge(['vendor_id' => $vendorId]);

        $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'notes' => 'nullable|string',
        ]);

        $vendor = \App\Models\Vendor::findOrFail($request->vendor_id);

        $order->update([
            'vendor_id' => $vendor->id,
            'status' => Order::STATUS_DICETAK,
        ]);

        $order->addStatusHistory(
            Order::STATUS_DICETAK,
            "Pesanan naik cetak ke Vendor {$vendor->name}. Email spesifikasi dan file dikirim.",
            auth()->id()
        );

        // Kirim email notifikasi ke Vendor jika email tersedia
        if (!empty($vendor->email)) {
            try {
                $emailBody = "Halo Tim {$vendor->name},\n\n"
                    . "Berikut spesifikasi order cetak kemasan resmi dari PT Kalebox Jaya Indonesia:\n\n"
                    . "Nomor Pesanan: #{$order->order_number}\n"
                    . "Klien: {$order->customer_name}\n"
                    . "Model Produk: " . ($order->product?->name ?? 'Custom Box') . "\n"
                    . "Dimensi: {$order->custom_length_cm} x {$order->custom_width_cm} x {$order->custom_height_cm} cm\n"
                    . "Bahan Kertas: " . ($order->material?->name ?? '-') . "\n"
                    . "Finishing: " . ($order->finishing?->name ?? 'Tanpa Finishing') . "\n"
                    . "Cutting: " . ($order->cutting?->name ?? 'Standard') . "\n"
                    . "Jumlah Cetak: {$order->quantity} pcs\n"
                    . "Catatan Cetak: " . ($request->input('notes') ?: 'Sesuai file pratinjau ACC terlampir.') . "\n\n"
                    . "Tautan Pratinjau Desain ACC: " . url("/pesanan/{$order->tracking_token}") . "\n\n"
                    . "Mohon konfirmasi jika file dan pesanan cetak telah mulai diproses.\n\n"
                    . "Hormat kami,\nTim Produksi & Operasional Kalebox";

                \Illuminate\Support\Facades\Mail::raw($emailBody, function ($message) use ($vendor, $order) {
                    $message->to($vendor->email)
                            ->subject("Order Cetak Offset #{$order->order_number} - Kalebox x {$vendor->name}");
                });
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Gagal mengirim email ke vendor {$vendor->name}: " . $e->getMessage());
            }
        }

        AuditLog::log('send_to_print', 'orders', $order->id, null, ['vendor' => $vendor->name]);

        return response()->json([
            'success' => true,
            'message' => "Pesanan resmi dinaikkan cetak ke vendor {$vendor->name}.",
            'data' => $order->load('vendor'),
        ]);
    }

    /**
     * Notifikasi Barang Siap Diambil/Dikirim (Section 8.5 Langkah 12)
     */
    public function markAsReady(Request $request, $order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);

        $pickupDate = $request->input('pickup_or_delivery_date') ?: Carbon::now()->toDateString();
        $order->update([
            'status' => Order::STATUS_SIAP,
            'is_ready_notified' => true,
            'pickup_or_delivery_date' => $pickupDate,
        ]);

        $order->addStatusHistory(
            Order::STATUS_SIAP,
            'Proses cetak selesai. Barang siap diambil di kantor atau dikirim ke alamat klien.',
            auth()->id()
        );

        // Notifikasi ke Staff Produksi dengan informasi lengkap
        $staffIds = [];
        if ($order->staff_id) {
            $staffIds[] = $order->staff_id;
        } else {
            $staffIds = User::whereHas('role', fn($q) => $q->where('name', 'staff'))->pluck('id')->toArray();
        }

        $specsMsg = "Pesanan #{$order->order_number} ({$order->customer_name}) telah selesai dicetak. Qty: {$order->quantity} pcs, Finishing: " . ($order->finishing?->name ?? '-') . ", Cutting: " . ($order->cutting?->name ?? '-') . ". Tanggal Siap: {$pickupDate}.";

        foreach ($staffIds as $sid) {
            Notification::create([
                'user_id' => $sid,
                'title' => 'Cetakan Sudah Siap - Siap Diambil / Dikirim',
                'message' => $specsMsg,
                'type' => 'order_ready',
                'reference_id' => $order->id,
            ]);
        }

        AuditLog::log('mark_order_ready', 'orders', $order->id);

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan diperbarui menjadi Siap Diambil/Dikirim. Tim Staff Produksi telah dinotifikasi.',
            'data' => $order,
        ]);
    }

    /**
     * Verifikasi Pembayaran oleh Admin
     */
    public function verifyPayment(Request $request, $order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);
        $request->validate([
            'status' => 'required|in:DP 50%,Lunas,Belum Dibayar',
            'paid_amount' => 'required|numeric|min:0',
        ]);

        $paid = (float) $request->paid_amount;
        $remaining = max(0, $order->total_price - $paid);

        $order->update([
            'payment_status' => $request->status,
            'paid_amount' => $paid,
            'remaining_amount' => $remaining,
        ]);

        // Catat Transaksi Keuangan Otomatis
        if ($paid > 0) {
            FinanceTransaction::create([
                'transaction_number' => 'TRX-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                'type' => 'Pemasukan',
                'category' => 'Pembayaran Pesanan',
                'order_id' => $order->id,
                'amount' => $paid,
                'transaction_date' => now()->toDateString(),
                'description' => "Pembayaran pesanan #{$order->order_number} ({$request->status}) dari {$order->customer_name}",
                'created_by' => auth()->id(),
            ]);
        }

        $order->addStatusHistory(
            $order->status,
            "Pembayaran diverifikasi oleh Admin: {$request->status} (Dibayar: Rp " . number_format($paid, 0, ',', '.') . ")",
            auth()->id()
        );

        AuditLog::log('verify_payment', 'orders', $order->id, null, ['payment_status' => $request->status, 'paid' => $paid]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran pesanan berhasil diverifikasi.',
            'data' => $order,
        ]);
    }

    /**
     * Toggle Prioritas Tinggi (Section 8.6)
     */
    public function togglePriority(Order $order)
    {
        $newState = !$order->is_high_priority;
        $order->update(['is_high_priority' => $newState]);

        if ($newState && $order->designer_id) {
            Notification::create([
                'user_id' => $order->designer_id,
                'title' => 'Tugas Menjadi Prioritas Tinggi',
                'message' => "Pesanan #{$order->order_number} ditandai sebagai Prioritas Tinggi!",
                'type' => 'high_priority',
                'reference_id' => $order->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status prioritas pesanan berhasil diubah.',
            'data' => $order,
        ]);
    }

    /**
     * Unduh Invoice PDF Resmi
     */
    public function downloadInvoice(Order $order)
    {
        $order->load(['client', 'product', 'category', 'finishing', 'cutting']);

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'company_name' => Setting::get('company_name', 'Kalebox Percetakan Kemasan'),
            'company_address' => Setting::get('company_address', 'Jl. Kolonel Pol. M. Thaher No. 88, Jambi'),
            'company_phone' => Setting::get('company_phone', '0812-3456-7890'),
        ]);

        return $pdf->download("invoice_{$order->order_number}.pdf");
    }

    /**
     * Unduh Surat Pesanan / SPK Produksi PDF untuk Tim Staff
     */
    public function downloadSpk(Order $order)
    {
        $order->load(['client', 'product', 'category', 'finishing', 'cutting', 'designer', 'staff']);

        $pdf = Pdf::loadView('pdf.spk', [
            'order' => $order,
            'company_name' => Setting::get('company_name', 'Kalebox Percetakan Kemasan'),
        ]);

        return $pdf->download("spk_produksi_{$order->order_number}.pdf");
    }

    // Alias methods to support multiple route definitions
    public function storePublic(Request $request)
    {
        return $this->publicStore($request);
    }

    public function showByTrackingToken($trackingToken)
    {
        return $this->publicTrack($trackingToken);
    }

    public function uploadPaymentProof(Request $request, $trackingToken)
    {
        return $this->publicPaymentProof($request, $trackingToken);
    }

    public function clientReviewDesign(Request $request, $trackingToken)
    {
        return $this->publicReview($request, $trackingToken);
    }

    public function markReady(Request $request, $order)
    {
        return $this->markAsReady($request, $order);
    }

    public function downloadInvoicePdf($order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);
        return $this->downloadInvoice($order);
    }

    public function downloadSpkPdf($order)
    {
        $order = $order instanceof Order ? $order : Order::findOrFail($order);
        return $this->downloadSpk($order);
    }

    public function storeInternal(Request $request)
    {
        return $this->publicStore($request);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $request->validate(['status' => 'required|string']);
        $newStatus = $request->status;
        $order->update(['status' => $newStatus]);

        $notes = $request->input('notes') ?: "Status pesanan diubah menjadi {$newStatus}";
        $order->addStatusHistory($newStatus, $notes, auth()->id());

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui',
            'data'    => $order,
        ]);
    }
}
