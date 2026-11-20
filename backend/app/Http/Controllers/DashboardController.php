<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Content;
use App\Models\FinanceTransaction;
use App\Models\LeaveRequest;
use App\Models\Order;
use App\Models\Overtime;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return $this->stats($request);
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();
        $deadlineThreshold = Carbon::now()->addHours(12);

        $data = [
            'role' => $user->role?->name,
            'user' => [
                'name' => $user->name,
                'role_display' => $user->role?->display_name,
                'email' => $user->email,
            ],
        ];

        // 1. STATS KHUSUS OWNER & MANAGER (Role 1 & 2)
        if ($user->isOwner() || $user->isManager()) {
            $data['orders_summary'] = [
                'total'    => Order::count(),
                'masuk'    => Order::where('status', Order::STATUS_MASUK)->count(),
                'diproses' => Order::where('status', Order::STATUS_DIPROSES)->count(),
                'revisi'   => Order::where('status', Order::STATUS_REVISI)->count(),
                'dicetak'  => Order::where('status', Order::STATUS_DICETAK)->count(),
                'siap'     => Order::where('status', Order::STATUS_SIAP)->count(),
            ];

            $data['priority_orders'] = Order::where('is_high_priority', true)
                ->where('status', '!=', Order::STATUS_SIAP)
                ->with(['product', 'designer'])
                ->limit(5)
                ->get();

            $data['deadline_soon_orders'] = Order::whereNotNull('deadline')
                ->where('deadline', '<=', $deadlineThreshold)
                ->where('deadline', '>=', $now)
                ->where('status', '!=', Order::STATUS_SIAP)
                ->with(['product', 'designer'])
                ->get();

            $data['contents_summary'] = [
                'total'   => Content::count(),
                'ide'     => Content::where('status', Content::STATUS_IDE)->count(),
                'proses'  => Content::where('status', Content::STATUS_PROSES)->count(),
                'tayang'  => Content::where('status', Content::STATUS_TAYANG)->count(),
            ];

            $data['attendance_today'] = [
                'total_present' => Attendance::where('date', $today)->where('status', 'Masuk')->count(),
                'total_late'    => Attendance::where('date', $today)->where('is_late', true)->count(),
                'total_absent'  => Attendance::where('date', $today)->where('status', 'Tidak Masuk')->count(),
                'total_leave'   => Attendance::where('date', $today)->whereIn('status', ['Izin', 'Sakit', 'Cuti'])->count(),
            ];

            $data['total_revenue'] = (float) FinanceTransaction::where('type', 'Pemasukan')->sum('amount');
            $data['total_expenses'] = (float) FinanceTransaction::where('type', 'Pengeluaran')->sum('amount');

            // Pengajuan Menunggu Persetujuan Pimpinan
            $data['pending_approvals'] = [
                'leaves_count'    => LeaveRequest::where('status', 'menunggu')->count(),
                'overtimes_count' => Overtime::where('status', 'menunggu')->count(),
                'recent_leaves'   => LeaveRequest::with(['employee.position'])
                    ->where('status', 'menunggu')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(),
            ];
        }

        // 2. STATS KHUSUS ADMIN (Role 3)
        elseif ($user->isAdmin()) {
            $data['new_orders'] = Order::where('status', Order::STATUS_MASUK)
                ->with(['product', 'client'])
                ->limit(5)
                ->get();

            $data['pending_revisions'] = Order::where('status', Order::STATUS_REVISI)
                ->with(['product', 'designer'])
                ->get();

            $data['submitted_designs'] = Order::whereHas('designs', fn($q) => $q->where('status', 'diajukan_ke_admin'))
                ->with(['product', 'designer'])
                ->get();

            $data['ready_to_print'] = Order::where('status', Order::STATUS_DIPROSES)
                ->whereHas('designs', fn($q) => $q->where('status', 'disetujui'))
                ->with('product')
                ->get();

            $data['ready_for_pickup'] = Order::where('status', Order::STATUS_SIAP)
                ->with(['product', 'client'])
                ->limit(5)
                ->get();
        }

        // 3. STATS KHUSUS DESIGNER (Role 4)
        elseif ($user->isDesign()) {
            $myOrdersQuery = Order::where('designer_id', $user->id)
                ->where('status', '!=', Order::STATUS_SIAP);

            $data['my_orders_count'] = (clone $myOrdersQuery)->count();

            // Label Prioritas Tinggi
            $data['priority_tasks'] = (clone $myOrdersQuery)
                ->where('is_high_priority', true)
                ->with(['product', 'client'])
                ->get();

            // Notifikasi Deadline <= 12 Jam
            $data['deadline_urgent'] = (clone $myOrdersQuery)
                ->whereNotNull('deadline')
                ->where('deadline', '<=', $deadlineThreshold)
                ->where('deadline', '>=', $now)
                ->with('product')
                ->get();

            // Revisi yang Menunggu Ditindaklanjuti
            $data['revisions_to_do'] = (clone $myOrdersQuery)
                ->where('status', Order::STATUS_REVISI)
                ->with(['product', 'revisions' => fn($q) => $q->orderBy('created_at', 'desc')->limit(1)])
                ->get();

            // Konten yang Ditugaskan
            $data['assigned_contents'] = Content::where('designer_user_id', $user->id)
                ->where('status', '!=', Content::STATUS_TAYANG)
                ->with('platform')
                ->get();
        }

        // 4. STATS KHUSUS STAFF PRODUKSI (Role 5)
        elseif ($user->isStaff()) {
            $data['production_tasks'] = Order::where('staff_id', $user->id)
                ->whereIn('status', [Order::STATUS_DICETAK, Order::STATUS_SIAP])
                ->with(['product', 'category', 'finishing', 'cutting'])
                ->get();

            $data['ready_items'] = Order::where('staff_id', $user->id)
                ->where('status', Order::STATUS_SIAP)
                ->with(['product', 'client'])
                ->get();
        }

        // =========================================================================
        // DATA PERSONAL UNTUK SETIAP INDIVIDU (Absensi, Cuti, Izin, Sakit, Lembur)
        // =========================================================================
        if ($user->employee) {
            $employeeId = $user->employee->id;

            // 1. Presensi Hari Ini
            $myAttendance = Attendance::where('employee_id', $employeeId)
                ->where('date', $today)
                ->first();

            // Cek apakah ada permohonan dispensasi (cuti/izin/sakit) yang disetujui untuk hari ini
            $activeLeaveToday = LeaveRequest::where('employee_id', $employeeId)
                ->where('status', 'disetujui')
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->first();

            $attendanceStatus = 'Belum Absen';
            if ($myAttendance) {
                $attendanceStatus = $myAttendance->status;
            } elseif ($activeLeaveToday) {
                $attendanceStatus = $activeLeaveToday->type; // 'Cuti', 'Izin', atau 'Sakit'
            }

            $data['my_attendance_today'] = [
                'has_checked_in'        => (bool)($myAttendance?->check_in_time),
                'check_in_time'         => $myAttendance?->check_in_time,
                'has_checked_out'       => (bool)($myAttendance?->check_out_time),
                'check_out_time'        => $myAttendance?->check_out_time,
                'status'                => $attendanceStatus,
                'is_late'               => (bool)($myAttendance?->is_late),
                'late_duration_minutes' => $myAttendance?->late_duration_minutes ?? 0,
                'active_leave'          => $activeLeaveToday ? [
                    'id'          => $activeLeaveToday->id,
                    'type'        => $activeLeaveToday->type,
                    'start_date'  => $activeLeaveToday->start_date->format('Y-m-d'),
                    'end_date'    => $activeLeaveToday->end_date->format('Y-m-d'),
                    'reason'      => $activeLeaveToday->reason,
                ] : null,
            ];

            // 2. Riwayat Pengajuan Cuti / Izin / Sakit Terbaru (5 Terakhir)
            $myLeaves = LeaveRequest::with(['approver'])
                ->where('employee_id', $employeeId)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($leave) {
                    return [
                        'id'             => $leave->id,
                        'type'           => $leave->type,
                        'start_date'     => $leave->start_date->format('Y-m-d'),
                        'end_date'       => $leave->end_date->format('Y-m-d'),
                        'reason'         => $leave->reason,
                        'attachment_url' => $leave->attachment_url,
                        'status'         => $leave->status, // 'menunggu', 'disetujui', 'ditolak'
                        'rejection_note' => $leave->rejection_note,
                        'approver_name'  => $leave->approver?->name,
                        'created_at'     => $leave->created_at->format('Y-m-d H:i'),
                    ];
                });

            $data['my_recent_leaves'] = $myLeaves;

            // 3. Riwayat Pengajuan Lembur Terbaru (5 Terakhir)
            $myOvertimes = Overtime::with(['approver'])
                ->where('employee_id', $employeeId)
                ->orderBy('date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($ot) {
                    return [
                        'id'             => $ot->id,
                        'date'           => $ot->date->format('Y-m-d'),
                        'start_time'     => $ot->start_time,
                        'end_time'       => $ot->end_time,
                        'duration_hours' => $ot->duration_hours,
                        'total_pay'      => $ot->total_pay,
                        'notes'          => $ot->notes,
                        'status'         => $ot->status ?? 'menunggu',
                        'rejection_note' => $ot->rejection_note,
                        'approver_name'  => $ot->approver?->name,
                    ];
                });

            $data['my_recent_overtimes'] = $myOvertimes;

            // 4. Rekap Presensi Bulan Berjalan
            $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
            $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

            $monthAttendances = Attendance::where('employee_id', $employeeId)
                ->whereBetween('date', [$startOfMonth, $endOfMonth])
                ->get();

            $data['my_monthly_summary'] = [
                'hadir'     => $monthAttendances->where('status', 'Masuk')->count(),
                'terlambat' => $monthAttendances->where('is_late', true)->count(),
                'dispensasi'=> LeaveRequest::where('employee_id', $employeeId)
                    ->where('status', 'disetujui')
                    ->where(function ($q) use ($startOfMonth, $endOfMonth) {
                        $q->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                          ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth]);
                    })->count(),
            ];
        }

        // =========================================================================
        // AGREGATOR TUGAS & TANGGUNG JAWAB AKTIF PENGGUNA (UNTUK SEMUA ROLE)
        // Menampilkan semua tugas di mana user bertanggung jawab:
        // - Konten Promosi (sebagai Desainer, PIC Konseptor, Uploader, atau Produksi)
        // - Desain Pesanan Box (sebagai Desainer)
        // - Produksi & Cetak Pesanan (sebagai Operator Cetak/QC)
        // - Verifikasi Pesanan Baru (sebagai Admin)
        // - Persetujuan Pengajuan Cuti/Lembur (sebagai Owner/Manager)
        // =========================================================================
        $myAssignedTasks = [];

        // 1. Tugas Konten Promosi Media Sosial
        $assignedContents = Content::where(function ($q) use ($user) {
                $q->where('designer_user_id', $user->id)
                  ->orWhere('pic_user_id', $user->id)
                  ->orWhere('uploader_user_id', $user->id)
                  ->orWhere('production_user_id', $user->id);
            })
            ->where('status', '!=', Content::STATUS_TAYANG)
            ->with(['platform', 'ideaUser', 'designerUser', 'picUser', 'uploaderUser'])
            ->orderBy('is_high_priority', 'desc')
            ->orderByRaw('COALESCE(publish_schedule, deadline, created_at) ASC')
            ->get();

        foreach ($assignedContents as $content) {
            $myRoles = [];
            if ($content->designer_user_id == $user->id) $myRoles[] = 'Desainer Visual';
            if ($content->pic_user_id == $user->id) $myRoles[] = 'PIC Konseptor';
            if ($content->uploader_user_id == $user->id) $myRoles[] = 'Penanggung Jawab Tayang';
            if ($content->production_user_id == $user->id) $myRoles[] = 'Tim Produksi';

            $targetDate = $content->publish_schedule 
                ? Carbon::parse($content->publish_schedule)->format('d M Y') 
                : ($content->deadline ? Carbon::parse($content->deadline)->format('d M Y') : 'Fleksibel');

            $myAssignedTasks[] = [
                'id'               => 'content_' . $content->id,
                'source_id'        => $content->id,
                'task_type'        => 'content',
                'category_label'   => 'Konten Promosi',
                'badge_color'      => 'pink',
                'platform'         => $content->platform?->name ?? 'Media Sosial',
                'platform_logo'    => $content->platform?->logo_url,
                'title'            => $content->title,
                'description'      => $content->brief,
                'caption_preview'  => $content->caption ? \Illuminate\Support\Str::limit($content->caption, 80) : null,
                'my_roles'         => $myRoles,
                'my_role_label'    => implode(' • ', $myRoles) ?: 'Penanggung Jawab',
                'status'           => $content->status,
                'manager_approval' => $content->manager_approval,
                'manager_notes'    => $content->manager_notes,
                'admin_notes'      => $content->admin_notes,
                'result_link'      => $content->result_link,
                'is_high_priority' => (bool)$content->is_high_priority,
                'target_date'      => $targetDate,
                'deadline_raw'     => $content->deadline ? $content->deadline->toISOString() : null,
                'action_url'       => '/internal/konten?id=' . $content->id,
                'action_label'     => 'Buka Konten',
                'created_at'       => $content->created_at?->diffForHumans() ?? '',
            ];
        }

        // 2. Tugas Desain Pesanan Box (Desainer Pesanan)
        $designOrders = Order::where('designer_id', $user->id)
            ->whereNotIn('status', [Order::STATUS_SIAP, 'siap', 'selesai', 'batal'])
            ->with(['product', 'client', 'member', 'revisions' => fn($q) => $q->latest()->limit(1)])
            ->orderBy('is_high_priority', 'desc')
            ->orderByRaw('COALESCE(deadline, created_at) ASC')
            ->get();

        foreach ($designOrders as $order) {
            $clientName = $order->customer_name ?: ($order->client?->name ?: ($order->member?->name ?: 'Pelanggan'));
            $revNote = ($order->status === Order::STATUS_REVISI && $order->revisions->isNotEmpty())
                ? 'Catatan Revisi: ' . $order->revisions->first()->notes
                : 'Jumlah: ' . $order->quantity . ' pcs';

            $myAssignedTasks[] = [
                'id'               => 'order_design_' . $order->id,
                'source_id'        => $order->id,
                'task_type'        => 'order_design',
                'category_label'   => 'Desain Pesanan Box',
                'badge_color'      => 'blue',
                'platform'         => 'Order #' . $order->order_number,
                'platform_logo'    => null,
                'title'            => ($order->product?->name ?? 'Custom Box') . ' (' . $order->quantity . ' pcs)',
                'description'      => 'Klien: ' . $clientName . ' • ' . $revNote,
                'my_roles'         => ['Desainer Pesanan'],
                'my_role_label'    => 'Desainer Grafis Pesanan',
                'status'           => $order->status,
                'is_high_priority' => (bool)$order->is_high_priority,
                'target_date'      => $order->deadline ? Carbon::parse($order->deadline)->format('d M Y H:i') : 'Tanpa Deadline',
                'deadline_raw'     => $order->deadline ? $order->deadline->toISOString() : null,
                'action_url'       => '/internal/pesanan?id=' . $order->id,
                'action_label'     => 'Kerjakan Desain',
                'created_at'       => $order->created_at?->diffForHumans() ?? '',
                'tracking_token'   => $order->tracking_token,
                'tracking_url'     => '/pesanan/' . $order->tracking_token,
                'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                'customer_name'    => $clientName,
            ];
        }

        // 3. Tugas Produksi & Cetak Pesanan (Operator Mesin Cetak / QC)
        $productionOrders = Order::where('staff_id', $user->id)
            ->whereIn('status', [Order::STATUS_DIPROSES, Order::STATUS_DICETAK, Order::STATUS_SIAP, 'diproses', 'dicetak'])
            ->with(['product', 'client', 'finishing', 'cutting'])
            ->orderBy('is_high_priority', 'desc')
            ->orderByRaw('COALESCE(delivery_date, pickup_or_delivery_date, created_at) ASC')
            ->get();

        foreach ($productionOrders as $order) {
            $finishing = $order->finishing?->name ?? 'Standar';
            $cutting = $order->cutting?->name ?? 'Standar';
            $size = ($order->custom_length_cm && $order->custom_width_cm && $order->custom_height_cm)
                ? "Ukuran: {$order->custom_length_cm}x{$order->custom_width_cm}x{$order->custom_height_cm} cm"
                : 'Ukuran Standar';

            $clientName = $order->customer_name ?: ($order->client?->name ?: 'Pelanggan');
            $isReady = $order->status === Order::STATUS_SIAP;

            $myAssignedTasks[] = [
                'id'               => 'order_prod_' . $order->id,
                'source_id'        => $order->id,
                'task_type'        => 'order_production',
                'category_label'   => $isReady ? 'Cetakan Siap Diambil / Kirim' : 'Produksi & Cetak',
                'badge_color'      => $isReady ? 'emerald' : 'indigo',
                'platform'         => 'SPK #' . $order->order_number,
                'platform_logo'    => null,
                'title'            => ($isReady ? 'Cetakan Siap: ' : '') . ($order->product?->name ?? 'Box Kemasan') . ' (' . $order->quantity . ' pcs)',
                'description'      => $isReady
                    ? "Klien: {$clientName} • Jumlah: {$order->quantity} pcs • Finishing: {$finishing} • Cutting: {$cutting} • Penyerahan: {$order->handover_type}"
                    : "{$size} • Finishing: {$finishing} • Cutting: {$cutting}",
                'my_roles'         => ['Operator Produksi & QC'],
                'my_role_label'    => $isReady ? 'Pengemasan & Penyerahan' : 'Operator Cetak & QC',
                'status'           => $order->status,
                'is_high_priority' => (bool)$order->is_high_priority,
                'target_date'      => $order->pickup_or_delivery_date ? Carbon::parse($order->pickup_or_delivery_date)->format('d M Y') : ($order->delivery_date ? Carbon::parse($order->delivery_date)->format('d M Y') : 'Fleksibel'),
                'deadline_raw'     => $order->pickup_or_delivery_date ? $order->pickup_or_delivery_date->toISOString() : null,
                'action_url'       => '/internal/pesanan?id=' . $order->id,
                'action_label'     => $isReady ? 'Rincian Pengemasan & Kirim' : 'Lihat SPK & Proses',
                'created_at'       => $order->created_at?->diffForHumans() ?? '',
                'tracking_token'   => $order->tracking_token,
                'tracking_url'     => '/pesanan/' . $order->tracking_token,
                'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                'customer_name'    => $clientName,
            ];
        }

        // 4. Tugas Tanggung Jawab Operasional Admin (Verifikasi Pesanan Baru & Review Desain)
        if ($user->isAdmin() || $user->isOwner() || $user->isManager()) {
            $adminPendingOrders = Order::where(function($q) {
                    $q->where('status', Order::STATUS_MASUK)
                      ->orWhere('payment_status', 'menunggu_verifikasi');
                })
                ->with(['product', 'client'])
                ->limit(10)
                ->get();

            foreach ($adminPendingOrders as $order) {
                $clientName = $order->customer_name ?: ($order->client?->name ?: 'Pelanggan');
                $myAssignedTasks[] = [
                    'id'               => 'order_admin_' . $order->id,
                    'source_id'        => $order->id,
                    'task_type'        => 'order_admin',
                    'category_label'   => 'Verifikasi Pesanan',
                    'badge_color'      => 'amber',
                    'platform'         => 'Order #' . $order->order_number,
                    'platform_logo'    => null,
                    'title'            => ($order->product?->name ?? 'Pesanan Box') . ' (' . $clientName . ')',
                    'description'      => 'Perlu verifikasi pembayaran & penugasan desainer (Rp ' . number_format($order->total_price ?? 0, 0, ',', '.') . ')',
                    'my_roles'         => ['Admin Kantor'],
                    'my_role_label'    => 'Admin Kantor & Verifikator',
                    'status'           => $order->status,
                    'is_high_priority' => (bool)$order->is_high_priority,
                    'target_date'      => 'Segera Verifikasi',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/pesanan?id=' . $order->id,
                    'action_label'     => 'Verifikasi Sekarang',
                    'created_at'       => $order->created_at?->diffForHumans() ?? '',
                    'tracking_token'   => $order->tracking_token,
                    'tracking_url'     => '/pesanan/' . $order->tracking_token,
                    'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                    'customer_name'    => $clientName,
                ];
            }

            // A. Revisi dari Klien yang masuk ke Admin (Klien -> Admin)
            $clientRevisions = \App\Models\OrderRevision::where('status', 'menunggu_admin')
                ->with(['order.product', 'order.client', 'order.designer'])
                ->get();
            foreach ($clientRevisions as $rev) {
                $order = $rev->order;
                if (!$order) continue;
                $myAssignedTasks[] = [
                    'id'               => 'rev_admin_' . $rev->id,
                    'source_id'        => $order->id,
                    'revision_id'      => $rev->id,
                    'task_type'        => 'order_revision_forward',
                    'category_label'   => 'Revisi dari Klien',
                    'badge_color'      => 'pink',
                    'platform'         => 'Order #' . $order->order_number,
                    'platform_logo'    => null,
                    'title'            => 'Revisi Klien: ' . ($order->product?->name ?? 'Kemasan Box') . ' (' . ($order->customer_name ?: $order->client?->name) . ')',
                    'description'      => 'Catatan Klien: ' . $rev->revision_notes,
                    'my_roles'         => ['Admin Kantor'],
                    'my_role_label'    => 'Teruskan ke Desainer (' . ($order->designer?->name ?? 'Desain') . ')',
                    'status'           => 'Menunggu Diteruskan ke Desain',
                    'is_high_priority' => true,
                    'target_date'      => 'Teruskan ke Desain',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/pesanan?id=' . $order->id,
                    'action_label'     => 'Teruskan ke Desain',
                    'tracking_token'   => $order->tracking_token,
                    'tracking_url'     => '/pesanan/' . $order->tracking_token,
                    'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                    'customer_name'    => $order->customer_name ?: ($order->client?->name ?? 'Pelanggan'),
                    'created_at'       => $rev->created_at?->diffForHumans() ?? '',
                ];
            }

            // B. Desain yang diajukan Desainer ke Admin (Desain -> Admin)
            $submittedDesigns = \App\Models\OrderDesign::where('status', 'diajukan_ke_admin')
                ->with(['order.product', 'order.client', 'designer'])
                ->get();
            foreach ($submittedDesigns as $des) {
                $order = $des->order;
                if (!$order) continue;
                $myAssignedTasks[] = [
                    'id'               => 'design_submit_' . $des->id,
                    'source_id'        => $order->id,
                    'design_id'        => $des->id,
                    'task_type'        => 'order_design_share_client',
                    'category_label'   => 'Desain Masuk dari Desainer',
                    'badge_color'      => 'blue',
                    'platform'         => 'Order #' . $order->order_number,
                    'platform_logo'    => null,
                    'title'            => "Desain V{$des->version_number} dari " . ($des->designer?->name ?? 'Desain'),
                    'description'      => "Klien: " . ($order->customer_name ?: $order->client?->name) . ($des->notes ? " • Catatan: {$des->notes}" : ""),
                    'my_roles'         => ['Admin Kantor'],
                    'my_role_label'    => 'Kirim Review ke Klien',
                    'status'           => 'Siap Dikirim ke Klien (WA)',
                    'is_high_priority' => true,
                    'target_date'      => 'Kirim ke Klien',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/pesanan?id=' . $order->id,
                    'action_label'     => 'Kirim ke Klien (WA)',
                    'tracking_token'   => $order->tracking_token,
                    'tracking_url'     => '/pesanan/' . $order->tracking_token,
                    'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                    'customer_name'    => $order->customer_name ?: ($order->client?->name ?? 'Pelanggan'),
                    'created_at'       => $des->created_at?->diffForHumans() ?? '',
                ];
            }

            // C. Pesanan yang disetujui Klien (ACC) siap naik cetak
            $accOrders = Order::whereHas('designs', fn($q) => $q->where('status', 'disetujui'))
                ->whereNotIn('status', [Order::STATUS_DICETAK, Order::STATUS_SIAP, 'selesai', 'batal'])
                ->with(['product', 'client'])
                ->get();
            foreach ($accOrders as $order) {
                $myAssignedTasks[] = [
                    'id'               => 'acc_order_' . $order->id,
                    'source_id'        => $order->id,
                    'task_type'        => 'order_print_dispatch',
                    'category_label'   => 'Desain Di-ACC Klien',
                    'badge_color'      => 'emerald',
                    'platform'         => 'Order #' . $order->order_number,
                    'platform_logo'    => null,
                    'title'            => "ACC Cetak: " . ($order->product?->name ?? 'Box Kemasan') . " ({$order->quantity} pcs)",
                    'description'      => "Klien: " . ($order->customer_name ?: $order->client?->name) . " telah menyetujui desain. Siap pilih vendor & naik cetak.",
                    'my_roles'         => ['Admin Kantor'],
                    'my_role_label'    => 'Pilih Vendor & Naik Cetak',
                    'status'           => 'Siap Naik Cetak',
                    'is_high_priority' => true,
                    'target_date'      => 'Naik Cetak',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/pesanan?id=' . $order->id,
                    'action_label'     => 'Pilih Vendor & Naik Cetak',
                    'tracking_token'   => $order->tracking_token,
                    'tracking_url'     => '/pesanan/' . $order->tracking_token,
                    'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                    'customer_name'    => $order->customer_name ?: ($order->client?->name ?? 'Pelanggan'),
                    'created_at'       => $order->updated_at?->diffForHumans() ?? '',
                ];
            }

            // D. Pesanan sedang dicetak vendor (siap ditandai selesai cetak)
            $printingOrders = Order::where('status', Order::STATUS_DICETAK)
                ->with(['product', 'client', 'vendor'])
                ->get();
            foreach ($printingOrders as $order) {
                $myAssignedTasks[] = [
                    'id'               => 'print_ready_' . $order->id,
                    'source_id'        => $order->id,
                    'task_type'        => 'order_mark_ready',
                    'category_label'   => 'Sedang Dicetak Vendor',
                    'badge_color'      => 'indigo',
                    'platform'         => 'Order #' . $order->order_number,
                    'platform_logo'    => null,
                    'title'            => "Cetak di " . ($order->vendor?->name ?? 'Vendor') . " ({$order->quantity} pcs)",
                    'description'      => "Klien: " . ($order->customer_name ?: $order->client?->name) . ". Jika vendor telah selesai, tandai cetakan siap.",
                    'my_roles'         => ['Admin Kantor'],
                    'my_role_label'    => 'Tandai Cetakan Selesai',
                    'status'           => 'Sedang Dicetak',
                    'is_high_priority' => false,
                    'target_date'      => 'Pantau Vendor',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/pesanan?id=' . $order->id,
                    'action_label'     => 'Cetakan Sudah Siap',
                    'tracking_token'   => $order->tracking_token,
                    'tracking_url'     => '/pesanan/' . $order->tracking_token,
                    'customer_phone'   => $order->customer_phone ?: ($order->client?->phone ?? null),
                    'customer_name'    => $order->customer_name ?: ($order->client?->name ?? 'Pelanggan'),
                    'created_at'       => $order->updated_at?->diffForHumans() ?? '',
                ];
            }
        }

        // 5. Tugas Tanggung Jawab Persetujuan Pimpinan (Owner & Manager)
        if ($user->isOwner() || $user->isManager()) {
            // Persetujuan Konten Promosi (Langkah 7 & 8)
            $managerPendingContents = Content::where('manager_approval', 'menunggu')
                ->with(['platform', 'ideaUser', 'designerUser', 'picUser'])
                ->get();
            foreach ($managerPendingContents as $content) {
                $myAssignedTasks[] = [
                    'id'               => 'content_mgr_' . $content->id,
                    'source_id'        => $content->id,
                    'task_type'        => 'content_manager_review',
                    'category_label'   => 'Persetujuan Konten',
                    'badge_color'      => 'purple',
                    'platform'         => $content->platform?->name ?? 'Media Sosial',
                    'platform_logo'    => $content->platform?->logo_url,
                    'title'            => "ACC Konten: {$content->title}",
                    'description'      => "Brief: {$content->brief}" . ($content->result_link ? " • Hasil: {$content->result_link}" : ""),
                    'my_roles'         => ['Manager / Pimpinan'],
                    'my_role_label'    => 'Persetujuan Akhir Konten',
                    'status'           => 'Menunggu Persetujuan Manager',
                    'is_high_priority' => true,
                    'target_date'      => 'Tinjau & ACC',
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/konten?id=' . $content->id,
                    'action_label'     => 'ACC / Minta Revisi',
                    'created_at'       => $content->updated_at?->diffForHumans() ?? '',
                ];
            }
            $pendingLeaves = LeaveRequest::where('status', 'menunggu')
                ->with(['employee.user', 'employee.position'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($pendingLeaves as $leave) {
                $empName = $leave->employee?->user?->name ?? 'Karyawan';
                $posName = $leave->employee?->position?->name ?? 'Staff';
                $dateRange = Carbon::parse($leave->start_date)->format('d M') . ' - ' . Carbon::parse($leave->end_date)->format('d M Y');

                $myAssignedTasks[] = [
                    'id'               => 'leave_appr_' . $leave->id,
                    'source_id'        => $leave->id,
                    'task_type'        => 'approval_leave',
                    'category_label'   => 'Persetujuan Dispensasi',
                    'badge_color'      => 'purple',
                    'platform'         => 'Pengajuan ' . $leave->type,
                    'platform_logo'    => null,
                    'title'            => "{$leave->type} dari {$empName} ({$posName})",
                    'description'      => "Periode: {$dateRange} • Alasan: {$leave->reason}",
                    'my_roles'         => ['Pimpinan'],
                    'my_role_label'    => 'Pimpinan / Persetujuan',
                    'status'           => 'Menunggu Persetujuan',
                    'is_high_priority' => true,
                    'target_date'      => $dateRange,
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/cuti-lembur',
                    'action_label'     => 'Tinjau & Setujui',
                    'created_at'       => $leave->created_at?->diffForHumans() ?? '',
                ];
            }

            $pendingOvertimes = Overtime::where('status', 'menunggu')
                ->with(['employee.user', 'employee.position'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($pendingOvertimes as $ot) {
                $empName = $ot->employee?->user?->name ?? 'Karyawan';
                $otDate = Carbon::parse($ot->date)->format('d M Y');

                $myAssignedTasks[] = [
                    'id'               => 'ot_appr_' . $ot->id,
                    'source_id'        => $ot->id,
                    'task_type'        => 'approval_overtime',
                    'category_label'   => 'Persetujuan Lembur',
                    'badge_color'      => 'purple',
                    'platform'         => 'Pengajuan Lembur',
                    'platform_logo'    => null,
                    'title'            => "Lembur {$ot->duration_hours} Jam - {$empName}",
                    'description'      => "Tanggal: {$otDate} • Pekerjaan: {$ot->notes}",
                    'my_roles'         => ['Pimpinan'],
                    'my_role_label'    => 'Pimpinan / Persetujuan',
                    'status'           => 'Menunggu Persetujuan',
                    'is_high_priority' => false,
                    'target_date'      => $otDate,
                    'deadline_raw'     => null,
                    'action_url'       => '/internal/cuti-lembur',
                    'action_label'     => 'Tinjau Lembur',
                    'created_at'       => $ot->created_at?->diffForHumans() ?? '',
                ];
            }
        }

        $data['my_assigned_tasks'] = $myAssignedTasks;
        $data['my_assigned_tasks_count'] = count($myAssignedTasks);
        $data['my_tasks_summary'] = [
            'total'      => count($myAssignedTasks),
            'contents'   => $assignedContents->count(),
            'orders'     => $designOrders->count() + $productionOrders->count(),
            'approvals'  => ($user->isOwner() || $user->isManager()) ? (count($pendingLeaves ?? []) + count($pendingOvertimes ?? [])) : 0,
        ];

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'data'    => $data,
        ]);
    }
}
