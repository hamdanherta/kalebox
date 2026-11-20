<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Content;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    /**
     * Display a listing of contents.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Content::with([
            'ideaUser',
            'picUser',
            'designerUser',
            'uploaderUser',
            'productionUser',
            'platform'
        ]);

        // Jika Desainer (Role 4): tampilkan yang ditugaskan ke dirinya
        if ($user->isDesign()) {
            $query->where('designer_user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->filled('is_high_priority')) {
            $query->where('is_high_priority', filter_var($request->is_high_priority, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('caption', 'like', "%{$s}%")
                  ->orWhere('brief', 'like', "%{$s}%");
            });
        }

        $perPage = $request->input('per_page', 50);
        $contents = $query->orderBy('is_high_priority', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->paginate($perPage);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => $contents,
        ]);
    }

    /**
     * Display the specified content.
     */
    public function show(Content $content)
    {
        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => $content->load([
                'ideaUser',
                'picUser',
                'designerUser',
                'uploaderUser',
                'productionUser',
                'platform',
                'statusHistories.user'
            ]),
        ]);
    }

    /**
     * Store a newly created content idea.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Normalisasi input agar fleksibel dari form frontend
        $brief = $request->input('brief') ?? $request->input('concept_brief') ?? '';
        $platformId = $request->input('platform_id') ?? $request->input('promotion_platform_id');
        $caption = $request->input('caption') ?? $request->input('caption_copy') ?? '';
        $contentType = $request->input('content_type') ?? 'feed';
        $designerUserId = $request->input('designer_user_id') ?: null;
        $picUserId = $request->input('pic_user_id') ?: null;
        $uploaderUserId = $request->input('uploader_user_id') ?: null;
        $productionUserId = $request->input('production_user_id') ?: null;
        $publishSchedule = $request->input('publish_schedule') ?: null;
        $deadline = $request->input('deadline') ?: $publishSchedule;

        // Merge normalized inputs into request for validation
        $request->merge([
            'brief'              => $brief,
            'platform_id'        => $platformId,
            'caption'            => $caption,
            'content_type'       => $contentType,
            'idea_user_id'       => $user->id,
            'designer_user_id'   => $designerUserId,
            'pic_user_id'        => $picUserId,
            'uploader_user_id'   => $uploaderUserId,
            'production_user_id' => $productionUserId,
            'publish_schedule'   => $publishSchedule,
            'deadline'           => $deadline,
        ]);

        $request->validate([
            'title'              => 'required|string|max:255',
            'platform_id'        => 'required|exists:promotion_platforms,id',
            'brief'              => 'required|string',
            'content_type'       => 'nullable|in:carousel,feed,stories,flyer,reels',
            'designer_user_id'   => 'nullable|exists:users,id',
            'pic_user_id'        => 'nullable|exists:users,id',
            'uploader_user_id'   => 'nullable|exists:users,id',
            'production_user_id' => 'nullable|exists:users,id',
            'publish_schedule'   => 'nullable|date',
            'deadline'           => 'nullable|date',
        ], [
            'title.required'       => 'Judul atau topik utama konten wajib diisi.',
            'platform_id.required' => 'Pilih salah satu platform media sosial promosi.',
            'platform_id.exists'   => 'Platform media sosial yang dipilih tidak valid.',
            'brief.required'       => 'Konsep dan brief ringkas konten wajib diisi.',
            'content_type.in'      => 'Format konten tidak valid.',
        ]);

        $content = Content::create([
            'title'              => $request->title,
            'brief'              => $request->brief,
            'caption'            => $request->caption,
            'idea_user_id'       => $request->idea_user_id,
            'pic_user_id'        => $request->pic_user_id,
            'designer_user_id'   => $request->designer_user_id,
            'uploader_user_id'   => $request->uploader_user_id,
            'production_user_id' => $request->production_user_id,
            'content_type'       => $request->content_type,
            'platform_id'        => $request->platform_id,
            'deadline'           => $request->deadline,
            'publish_schedule'   => $request->publish_schedule,
            'result_link'        => $request->result_link ?? $request->result_url,
            'status'             => Content::STATUS_IDE,
            'is_high_priority'   => filter_var($request->input('is_high_priority', false), FILTER_VALIDATE_BOOLEAN),
            'notes'              => $request->notes,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_IDE,
            'notes'   => 'Ide konten baru berhasil dicatat dalam alur promosi.',
        ]);

        // Notifikasi ke Desainer jika ada
        if ($content->designer_user_id && $content->designer_user_id !== $user->id) {
            Notification::create([
                'user_id'      => $content->designer_user_id,
                'title'        => 'Tugas Konten Promosi Baru',
                'message'      => "Anda ditugaskan pada ide konten baru: {$content->title}.",
                'type'         => 'content_assigned',
                'reference_id' => $content->id,
            ]);
        }

        AuditLog::log('create_content', 'contents', $content->id, null, [
            'title'       => $content->title,
            'platform_id' => $content->platform_id,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Ide konten promosi berhasil dicatat!',
            'data'    => $content->load(['platform', 'designerUser', 'picUser']),
        ], 201);
    }

    /**
     * Langkah 2: Admin menaikkan ke Konten Antri dan memilih Penanggung Jawab, Desain, Produksi, dan Upload
     */
    public function queue(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $request->validate([
            'pic_user_id'        => 'required|exists:users,id',
            'designer_user_id'   => 'required|exists:users,id',
            'production_user_id' => 'nullable|exists:users,id',
            'uploader_user_id'   => 'nullable|exists:users,id',
            'deadline'           => 'nullable|date',
            'publish_schedule'   => 'nullable|date',
        ], [
            'pic_user_id.required'      => 'Penanggung Jawab (PIC) wajib dipilih.',
            'designer_user_id.required' => 'Desainer Grafis wajib dipilih.',
        ]);

        $content->update([
            'pic_user_id'        => $request->pic_user_id,
            'designer_user_id'   => $request->designer_user_id,
            'production_user_id' => $request->production_user_id,
            'uploader_user_id'   => $request->uploader_user_id,
            'deadline'           => $request->deadline ?: $content->deadline,
            'publish_schedule'   => $request->publish_schedule ?: $content->publish_schedule,
            'status'             => Content::STATUS_ANTRI,
            'manager_approval'   => null,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_ANTRI,
            'notes'   => 'Admin menaikkan konten ke Konten Antri dan menetapkan Penanggung Jawab, Desain, Produksi, dan Upload.',
        ]);

        // Notifikasi ke Penanggung Jawab, Desain, dan Produksi (Langkah 3)
        $assignedIds = array_filter(array_unique([
            $content->pic_user_id,
            $content->designer_user_id,
            $content->production_user_id,
        ]));

        foreach ($assignedIds as $assignedId) {
            Notification::create([
                'user_id'      => $assignedId,
                'title'        => 'Konten Masuk Antrean',
                'message'      => "Konten '{$content->title}' telah masuk ke antrean tugas Anda.",
                'type'         => 'content_queued',
                'reference_id' => $content->id,
            ]);
        }

        AuditLog::log('queue_content', 'contents', $content->id, null, [
            'pic'        => $content->pic_user_id,
            'designer'   => $content->designer_user_id,
            'production' => $content->production_user_id,
            'uploader'   => $content->uploader_user_id,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Konten berhasil dinaikkan ke Konten Antri dan ditugaskan ke tim.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser', 'productionUser', 'uploaderUser']),
        ]);
    }

    /**
     * Langkah 4: Desain klik Mulai Kerjakan -> tahap Konten Di Proses
     */
    public function startWork(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $content->update([
            'status' => Content::STATUS_PROSES,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_PROSES,
            'notes'   => 'Desainer mulai mengerjakan pembuatan konten.',
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Konten resmi masuk tahap pengerjaan (Konten Di Proses).',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
        ]);
    }

    /**
     * Langkah 5: Desain klik Ajukan (mengisi link hasil / preview)
     */
    public function submitWork(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $resultUrl = $request->input('result_url') ?? $request->input('result_link') ?? $request->input('link');
        $notes = $request->input('notes') ?: 'Desainer telah menyelesaikan draf konten dan mengajukannya ke Admin.';

        if ($resultUrl) {
            $content->result_link = $resultUrl;
        }
        if ($request->filled('caption')) {
            $content->caption = $request->input('caption');
        }

        // Tetap di STATUS_PROSES atau STATUS_REVISI namun tercatat pengajuan ke Admin
        $content->save();

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => $content->status,
            'notes'   => "Desainer mengajukan hasil konten ke Admin untuk ditinjau" . ($resultUrl ? " (Link: {$resultUrl})" : ""),
        ]);

        // Notifikasi ke Admin
        $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['owner', 'manager', 'admin']))->get();
        foreach ($admins as $adm) {
            Notification::create([
                'user_id'      => $adm->id,
                'title'        => 'Draf Konten Diajukan',
                'message'      => "Desainer telah mengajukan hasil untuk konten '{$content->title}'. Silakan tinjau.",
                'type'         => 'content_submitted',
                'reference_id' => $content->id,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Hasil konten berhasil diajukan ke Admin.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser', 'statusHistories.user']),
        ]);
    }

    /**
     * Langkah 6: Admin meninjau di dasbornya (Revisi -> Konten Sedang Revisi, Oke -> Konten Ok)
     */
    public function adminReview(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $request->validate([
            'decision' => 'required|in:oke,ok,revisi,Oke,Ok,Revisi,setuju,Setuju',
            'notes'    => 'nullable|string',
        ]);

        $decision = strtolower($request->decision);

        if ($decision === 'revisi') {
            $notes = $request->input('notes') ?: 'Admin meminta revisi pada konten.';
            $content->update([
                'status'      => Content::STATUS_REVISI,
                'admin_notes' => $notes,
            ]);

            $content->statusHistories()->create([
                'user_id' => $user->id,
                'status'  => Content::STATUS_REVISI,
                'notes'   => "Admin meminta revisi: {$notes}",
            ]);

            if ($content->designer_user_id) {
                Notification::create([
                    'user_id'      => $content->designer_user_id,
                    'title'        => 'Revisi Konten dari Admin',
                    'message'      => "Konten '{$content->title}' memerlukan revisi: {$notes}",
                    'type'         => 'content_revision',
                    'reference_id' => $content->id,
                ]);
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Catatan revisi berhasil dikirim ke Desainer.',
                'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
            ]);
        } else {
            // Oke -> Konten Ok
            $content->update([
                'status'      => Content::STATUS_OK,
                'admin_notes' => null,
            ]);

            $content->statusHistories()->create([
                'user_id' => $user->id,
                'status'  => Content::STATUS_OK,
                'notes'   => 'Admin menyetujui hasil desain konten (Oke). Siap diajukan ke Manager.',
            ]);

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Konten disetujui Admin (Konten Ok)! Sekarang Anda dapat mengajukannya ke Manager.',
                'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
            ]);
        }
    }

    /**
     * Langkah 7: Admin mengajukan konten ke Manager (konten muncul di dasbor Manager)
     */
    public function submitToManager(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $content->update([
            'manager_approval' => 'menunggu',
            'manager_notes'    => null,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => $content->status,
            'notes'   => 'Admin mengajukan konten ke Manager untuk persetujuan akhir.',
        ]);

        // Notifikasi ke Manager dan Owner
        $managers = User::whereHas('role', fn($q) => $q->whereIn('name', ['manager', 'owner']))->get();
        foreach ($managers as $mgr) {
            Notification::create([
                'user_id'      => $mgr->id,
                'title'        => 'Persetujuan Konten Menunggu',
                'message'      => "Admin mengajukan konten '{$content->title}' untuk peninjauan dan persetujuan Manager.",
                'type'         => 'content_manager_approval',
                'reference_id' => $content->id,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Konten berhasil diajukan ke Manager untuk peninjauan.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
        ]);
    }

    /**
     * Langkah 8: Manager meninjau (Revisi / Oke)
     */
    public function managerReview(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $request->validate([
            'decision' => 'required|in:oke,ok,revisi,Oke,Ok,Revisi,setuju,Setuju',
            'notes'    => 'nullable|string',
        ]);

        $decision = strtolower($request->decision);

        if ($decision === 'revisi') {
            $notes = $request->input('notes') ?: 'Manager meminta perbaikan/revisi pada konten.';
            $content->update([
                'manager_approval' => 'revisi',
                'manager_notes'    => $notes,
            ]);

            $content->statusHistories()->create([
                'user_id' => $user->id,
                'status'  => $content->status,
                'notes'   => "Manager meminta revisi: {$notes}. Dikembalikan ke Admin.",
            ]);

            // Notifikasi ke Admin
            $admins = User::whereHas('role', fn($q) => $q->where('name', 'admin'))->get();
            foreach ($admins as $adm) {
                Notification::create([
                    'user_id'      => $adm->id,
                    'title'        => 'Catatan Revisi dari Manager',
                    'message'      => "Manager meminta revisi untuk konten '{$content->title}': {$notes}",
                    'type'         => 'content_manager_revision',
                    'reference_id' => $content->id,
                ]);
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Catatan revisi Manager berhasil dikirimkan kembali ke Admin.',
                'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
            ]);
        } else {
            // Oke -> Disetujui Manager
            $content->update([
                'manager_approval' => 'disetujui',
                'manager_notes'    => null,
            ]);

            $content->statusHistories()->create([
                'user_id' => $user->id,
                'status'  => $content->status,
                'notes'   => 'Manager menyetujui konten (ACC). Admin sekarang dapat menaikkan ke Konten Siap Tayang.',
            ]);

            // Notifikasi ke Admin
            $admins = User::whereHas('role', fn($q) => $q->where('name', 'admin'))->get();
            foreach ($admins as $adm) {
                Notification::create([
                    'user_id'      => $adm->id,
                    'title'        => 'Konten Disetujui Manager (ACC)',
                    'message'      => "Manager telah menyetujui konten '{$content->title}'. Anda sekarang dapat menaikkannya ke Konten Siap Tayang.",
                    'type'         => 'content_manager_approved',
                    'reference_id' => $content->id,
                ]);
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Konten berhasil disetujui (ACC Manager). Admin sekarang dapat menaikkan ke Konten Siap Tayang.',
                'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
            ]);
        }
    }

    /**
     * Langkah 8b: Admin meneruskan revisi dari Manager ke Desain
     */
    public function forwardManagerRevision(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $notes = $request->input('notes') ?: ($content->manager_notes ?: 'Perbaikan konten sesuai arahan Manager.');

        $content->update([
            'status'           => Content::STATUS_REVISI,
            'admin_notes'      => $notes,
            'manager_approval' => null, // Reset status manager approval sampai diajukan lagi
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_REVISI,
            'notes'   => "Admin meneruskan revisi Manager ke Desainer: {$notes}",
        ]);

        if ($content->designer_user_id) {
            Notification::create([
                'user_id'      => $content->designer_user_id,
                'title'        => 'Tugas Revisi dari Manager & Admin',
                'message'      => "Konten '{$content->title}' memerlukan revisi: {$notes}",
                'type'         => 'content_revision',
                'reference_id' => $content->id,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Catatan revisi berhasil diteruskan ke Desainer.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
        ]);
    }

    /**
     * Langkah 9: Admin menaikkan ke Konten Siap Tayang (muncul di dasbor Uploader)
     */
    public function readyToPublish(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        if ($content->manager_approval !== 'disetujui' && $content->status !== Content::STATUS_OK) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Konten belum disetujui oleh Manager (ACC).',
            ], 422);
        }

        $content->update([
            'status' => Content::STATUS_SIAP,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_SIAP,
            'notes'   => 'Admin menaikkan konten ke tahap Konten Siap Tayang.',
        ]);

        // Muncul di dasbor orang yang dipilih di kolom Upload (Langkah 9)
        if ($content->uploader_user_id) {
            Notification::create([
                'user_id'      => $content->uploader_user_id,
                'title'        => 'Tugas Upload Konten',
                'message'      => "Konten '{$content->title}' telah Siap Tayang. Silakan unggah ke platform {$content->platform?->name}.",
                'type'         => 'content_ready_to_upload',
                'reference_id' => $content->id,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Konten berhasil dinaikkan ke Konten Siap Tayang dan muncul di dasbor Tim Upload.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser', 'uploaderUser']),
        ]);
    }

    /**
     * Langkah 10: Setelah diupload, mengisi kolom Hasil (link) dan menandai -> Konten Sudah Tayang
     */
    public function markPublished(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        $resultLink = $request->input('result_link') ?? $request->input('link') ?? $request->input('result_url') ?? $content->result_link;

        $content->update([
            'status'      => Content::STATUS_TAYANG,
            'result_link' => $resultLink,
        ]);

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => Content::STATUS_TAYANG,
            'notes'   => "Konten telah berhasil ditayangkan" . ($resultLink ? " (Link Publikasi: {$resultLink})" : ""),
        ]);

        AuditLog::log('mark_content_published', 'contents', $content->id, null, ['link' => $resultLink]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Selamat! Konten telah resmi dipublikasikan (Konten Sudah Tayang).',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser', 'uploaderUser']),
        ]);
    }

    /**
     * Advance content status to next stage in pipeline (backward compatibility)
     */
    public function advanceStatus(Request $request, $id)
    {
        $content = Content::findOrFail($id);
        $user = $request->user();

        // Alur tahapan konten berurutan
        $stages = [
            Content::STATUS_IDE,
            Content::STATUS_ANTRI,
            Content::STATUS_PROSES,
            Content::STATUS_OK,
            Content::STATUS_SIAP,
            Content::STATUS_TAYANG,
        ];

        // Tentukan status berikutnya
        $currentStatus = $content->status;
        $nextStatus = null;

        if ($request->filled('target_status') || $request->filled('status')) {
            $nextStatus = $request->input('target_status') ?? $request->input('status');
        } else {
            $idx = array_search($currentStatus, $stages);
            if ($idx !== false && $idx < count($stages) - 1) {
                $nextStatus = $stages[$idx + 1];
            } else {
                $nextStatus = Content::STATUS_TAYANG;
            }
        }

        $resultUrl = $request->input('result_url') ?? $request->input('result_link');
        if ($resultUrl) {
            $content->result_link = $resultUrl;
        }

        if ($request->filled('caption')) {
            $content->caption = $request->input('caption');
        }

        $notes = $request->input('notes') ?: "Status dimajukan dari {$currentStatus} ke {$nextStatus}";

        $content->status = $nextStatus;
        $content->save();

        $content->statusHistories()->create([
            'user_id' => $user->id,
            'status'  => $nextStatus,
            'notes'   => $notes,
        ]);

        // Notifikasi ke desainer / pic
        if ($content->designer_user_id && $content->designer_user_id !== $user->id) {
            Notification::create([
                'user_id'      => $content->designer_user_id,
                'title'        => "Alur Konten: {$nextStatus}",
                'message'      => "Konten '{$content->title}' telah berpindah ke tahap {$nextStatus}.",
                'type'         => 'content_stage_update',
                'reference_id' => $content->id,
            ]);
        }

        AuditLog::log('advance_content_status', 'contents', $content->id, null, [
            'from' => $currentStatus,
            'to'   => $nextStatus,
        ]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => "Status alur konten berhasil diubah menjadi {$nextStatus}.",
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser', 'statusHistories.user']),
        ]);
    }

    /**
     * Update Status Alur Konten (Alias for advanceStatus)
     */
    public function updateStatus(Request $request, $id)
    {
        return $this->advanceStatus($request, $id);
    }

    /**
     * Update content details.
     */
    public function update(Request $request, $id)
    {
        $content = Content::findOrFail($id);

        $data = $request->only([
            'title',
            'brief',
            'caption',
            'platform_id',
            'content_type',
            'designer_user_id',
            'pic_user_id',
            'publish_schedule',
            'deadline',
            'result_link',
            'is_high_priority',
            'notes',
        ]);

        $content->update($data);
        AuditLog::log('update_content', 'contents', $content->id, null, $data);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Data konten promosi berhasil diperbarui.',
            'data'    => $content->fresh(['platform', 'designerUser', 'picUser']),
        ]);
    }

    /**
     * Toggle high priority flag.
     */
    public function togglePriority(Content $content)
    {
        $newState = !$content->is_high_priority;
        $content->update(['is_high_priority' => $newState]);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Status prioritas konten berhasil diubah.',
            'data'    => $content,
        ]);
    }

    /**
     * Delete content.
     */
    public function destroy(Content $content)
    {
        $content->delete();
        AuditLog::log('delete_content', 'contents', $content->id);

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Konten promosi berhasil dihapus.',
        ]);
    }
}
