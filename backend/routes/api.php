<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\FinishingController;
use App\Http\Controllers\CuttingController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\QrisSettingController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\EmployeeStatusController;
use App\Http\Controllers\WorkScheduleController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\BonusController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PromotionPlatformController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegistrationCodeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\AuditLogController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth Public
Route::prefix('auth')->group(function () {
    Route::post('/member/login', [AuthController::class, 'loginMember']);
    Route::post('/member/register', [AuthController::class, 'registerMember']);
    Route::post('/internal/login', [AuthController::class, 'loginInternal']);
    Route::post('/internal/register', [AuthController::class, 'registerInternal']);
    Route::post('/internal/verify-invitation', [AuthController::class, 'verifyInvitationCode']);
});

// Master Data Public
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/category/{categoryId}', [ProductController::class, 'byCategory']);
Route::get('/product-categories', [ProductCategoryController::class, 'index']);
Route::get('/materials', [MaterialController::class, 'index']);
Route::get('/finishings', [FinishingController::class, 'index']);
Route::get('/cuttings', [CuttingController::class, 'index']);
Route::get('/qris/active', [QrisSettingController::class, 'getActive']);
Route::get('/settings', [SettingController::class, 'index']);

// Orders Public Flow
Route::post('/orders', [OrderController::class, 'storePublic']);
Route::get('/orders/track/{trackingToken}', [OrderController::class, 'showByTrackingToken']);
Route::post('/orders/track/{trackingToken}/payment', [OrderController::class, 'uploadPaymentProof']);
Route::post('/orders/track/{trackingToken}/review-design', [OrderController::class, 'clientReviewDesign']);

// Careers Public Flow
Route::get('/careers', [CareerController::class, 'publicIndex']);
Route::get('/careers/{id}', [CareerController::class, 'publicShow']);
Route::post('/careers/{id}/apply', [CareerController::class, 'apply']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current User Profile & Password
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Member Specific Features (Role 6)
    Route::prefix('member')->group(function () {
        Route::get('/orders', [MemberController::class, 'orders']);
        Route::get('/profile', [MemberController::class, 'profile']);
        Route::put('/profile', [MemberController::class, 'updateProfile']);
    });

    /*
    |--------------------------------------------------------------------------
    | Internal Employee Routes (Role 1 - 5)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:owner,manager,admin,design,staff')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Presensi (Attendance)
        Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
        Route::get('/attendance/today', [AttendanceController::class, 'today']);
        Route::get('/attendance/history', [AttendanceController::class, 'history']);

        // Cuti & Lembur Karyawan
        Route::get('/leaves/my', [LeaveRequestController::class, 'myLeaves']);
        Route::post('/leaves', [LeaveRequestController::class, 'store']);
        Route::delete('/leaves/{id}', [LeaveRequestController::class, 'destroy']);
        Route::get('/overtimes/my', [OvertimeController::class, 'myOvertimes']);
        Route::post('/overtimes', [OvertimeController::class, 'store']);
        Route::delete('/overtimes/{id}', [OvertimeController::class, 'destroy']);

        // Pesanan (Orders)
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders/internal', [OrderController::class, 'storeInternal']);
        Route::put('/orders/{id}/verify-payment', [OrderController::class, 'verifyPayment']);
        Route::put('/orders/{id}/assign', [OrderController::class, 'assignTeam']);
        Route::put('/orders/{id}/start-work', [OrderController::class, 'startWork']);
        Route::post('/orders/{id}/submit-design', [OrderController::class, 'submitDesign']);
        Route::put('/orders/{id}/forward-revision', [OrderController::class, 'forwardRevisionToDesigner']);
        Route::put('/orders/{id}/send-to-client', [OrderController::class, 'sendDesignToClient']);
        Route::put('/orders/{id}/send-to-print', [OrderController::class, 'sendToPrint']);
        Route::put('/orders/{id}/mark-ready', [OrderController::class, 'markReady']);
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::get('/orders/{id}/invoice-pdf', [OrderController::class, 'downloadInvoicePdf']);
        Route::get('/orders/{id}/spk-pdf', [OrderController::class, 'downloadSpkPdf']);

        // Konten Promosi
        Route::get('/contents', [ContentController::class, 'index']);
        Route::get('/contents/{id}', [ContentController::class, 'show']);
        Route::post('/contents', [ContentController::class, 'store']);
        Route::put('/contents/{id}', [ContentController::class, 'update']);
        Route::put('/contents/{id}/advance-status', [ContentController::class, 'advanceStatus']);
        Route::put('/contents/{id}/queue', [ContentController::class, 'queue']);
        Route::put('/contents/{id}/start-work', [ContentController::class, 'startWork']);
        Route::put('/contents/{id}/submit-work', [ContentController::class, 'submitWork']);
        Route::put('/contents/{id}/admin-review', [ContentController::class, 'adminReview']);
        Route::put('/contents/{id}/submit-to-manager', [ContentController::class, 'submitToManager']);
        Route::put('/contents/{id}/manager-review', [ContentController::class, 'managerReview']);
        Route::put('/contents/{id}/forward-manager-revision', [ContentController::class, 'forwardManagerRevision']);
        Route::put('/contents/{id}/ready-to-publish', [ContentController::class, 'readyToPublish']);
        Route::put('/contents/{id}/mark-published', [ContentController::class, 'markPublished']);
        Route::delete('/contents/{id}', [ContentController::class, 'destroy']);
        Route::get('/promotion-platforms', [PromotionPlatformController::class, 'index']);
        Route::get('/promotion-platforms/{id}', [PromotionPlatformController::class, 'show']);

        // Master Produk
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::apiResource('materials', MaterialController::class)->except(['index']);
        Route::apiResource('finishings', FinishingController::class)->except(['index']);
        Route::apiResource('cuttings', CuttingController::class)->except(['index']);

        // Master Mitra & Klien (Klien & Member bisa dikelola oleh Role 3, 2, 1)
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
        Route::post('/clients', [ClientController::class, 'store']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);
        Route::get('/members', [MemberController::class, 'index']);

        // Daftar Karyawan (Read-Only untuk penugasan tim pesanan oleh Admin)
        Route::get('/employees', [EmployeeController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | Executive Routes (Owner & Manager ONLY - Role 1 & 2)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:owner,manager')->group(function () {
        // Attendance Management (Hanya Owner & Manager yang mengelola & melihat seluruh presensi)
        Route::get('/attendance/all', [AttendanceController::class, 'index']);
        Route::post('/attendance/manual', [AttendanceController::class, 'storeManual']);
        Route::put('/attendance/{id}', [AttendanceController::class, 'update']);
        Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);
        Route::get('/attendance/daily-pdf', [AttendanceController::class, 'downloadDailyPdf']);

        // Leave & Overtime Review (Hanya Owner & Manager yang menyetujui)
        Route::get('/leaves', [LeaveRequestController::class, 'index']);
        Route::put('/leaves/{id}/status', [LeaveRequestController::class, 'updateStatus']);
        Route::get('/overtimes', [OvertimeController::class, 'index']);
        Route::put('/overtimes/{id}/status', [OvertimeController::class, 'updateStatus']);

        // HR & Employee Management (Role 2, 1)
        Route::get('/employees/{id}', [EmployeeController::class, 'show']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::apiResource('divisions', DivisionController::class);
        Route::apiResource('positions', PositionController::class);
        Route::apiResource('employee-statuses', EmployeeStatusController::class);
        Route::apiResource('work-schedules', WorkScheduleController::class);
        Route::apiResource('bonuses', BonusController::class);
        Route::apiResource('registration-codes', RegistrationCodeController::class);

        // Payroll Management (Role 2, 1 - Penggajian hanya untuk Owner & Manager)
        Route::get('/payrolls', [PayrollController::class, 'index']);
        Route::get('/payrolls/{id}', [PayrollController::class, 'show']);
        Route::post('/payrolls', [PayrollController::class, 'store']);
        Route::put('/payrolls/{id}', [PayrollController::class, 'update']);
        Route::delete('/payrolls/{id}', [PayrollController::class, 'destroy']);
        Route::post('/payrolls/generate', [PayrollController::class, 'generateMonthly']);
        Route::put('/payrolls/{id}/status', [PayrollController::class, 'updateStatus']);
        Route::post('/payrolls/{id}/bonus', [PayrollController::class, 'setBonus']);
        Route::get('/payrolls/{id}/slip-pdf', [PayrollController::class, 'downloadPayslipPdf']);

        // Master Khusus Eksekutif (Kategori Produk, Vendor, QRIS, Platform Promosi)
        Route::apiResource('product-categories', ProductCategoryController::class)->except(['index']);
        Route::apiResource('vendors', VendorController::class);
        Route::apiResource('qris', QrisSettingController::class);
        Route::post('/promotion-platforms', [PromotionPlatformController::class, 'store']);
        Route::put('/promotion-platforms/{id}', [PromotionPlatformController::class, 'update']);
        Route::post('/promotion-platforms/{id}', [PromotionPlatformController::class, 'update']);
        Route::delete('/promotion-platforms/{id}', [PromotionPlatformController::class, 'destroy']);

        // Keuangan & Kas
        Route::get('/finance', [FinanceController::class, 'index']);
        Route::get('/finance/summary', [FinanceController::class, 'summary']);
        Route::post('/finance', [FinanceController::class, 'store']);

        // Internal Careers Management
        Route::get('/internal/careers', [CareerController::class, 'internalIndex']);
        Route::post('/internal/careers', [CareerController::class, 'store']);
        Route::put('/internal/careers/{id}', [CareerController::class, 'update']);
        Route::delete('/internal/careers/{id}', [CareerController::class, 'destroy']);
        Route::get('/internal/job-applications', [CareerController::class, 'applications']);
        Route::put('/internal/job-applications/{id}/status', [CareerController::class, 'updateApplicationStatus']);

        // Pengaturan Sistem & Audit Log
        Route::put('/settings', [SettingController::class, 'update']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | Owner Exclusive Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:owner')->group(function () {
        Route::delete('/finance/{id}', [FinanceController::class, 'destroy']);
    });
});
