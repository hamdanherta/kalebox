<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('employee_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('duration_type', ['Selamanya', 'Berbatas Waktu'])->default('Selamanya');
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });

        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Jadwal Standar');
            $table->time('start_time')->default('08:00:00');
            $table->time('end_time')->default('17:00:00');
            $table->json('work_days'); // ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('employee_id_number')->default('-'); // NIKaryawan terbit setelah 1 tahun
            $table->string('nik', 16); // 16 digit KTP
            $table->string('name');
            $table->text('address');
            $table->string('domicile');
            $table->foreignId('position_id')->constrained('positions')->cascadeOnDelete();
            $table->foreignId('employee_status_id')->constrained('employee_statuses')->cascadeOnDelete();
            $table->date('hire_date');
            $table->time('start_time')->default('08:00:00');
            $table->time('end_time')->default('17:00:00');
            $table->decimal('daily_salary', 15, 2)->default(0);
            $table->string('profile_photo')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->enum('status', ['Menunggu', 'Masuk', 'Tidak Masuk', 'Izin', 'Sakit', 'Lembur'])->default('Menunggu');
            $table->boolean('is_late')->default(false);
            $table->string('check_in_photo')->nullable();
            $table->string('check_out_photo')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('distance_meter', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'date']);
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('type', ['Sakit', 'Izin']);
            $table->text('reason');
            $table->string('attachment_path')->nullable(); // PDF/JPEG bukti sakit
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_note')->nullable();
            $table->timestamps();
        });

        Schema::create('overtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('rate_per_hour', 15, 2)->default(0);
            $table->decimal('duration_hours', 5, 2)->default(0);
            $table->decimal('total_pay', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('bonuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('amount', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->decimal('daily_salary', 15, 2)->default(0);
            $table->unsignedSmallInteger('days_present')->default(0);
            $table->unsignedSmallInteger('days_permission')->default(0);
            $table->unsignedSmallInteger('days_sick')->default(0);
            $table->unsignedSmallInteger('days_absent')->default(0);
            $table->unsignedSmallInteger('times_late')->default(0);
            $table->decimal('late_penalty_total', 15, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->decimal('overtime_total', 15, 2)->default(0);
            $table->foreignId('bonus_id')->nullable()->constrained('bonuses')->nullOnDelete();
            $table->decimal('bonus_amount', 15, 2)->default(0);
            $table->decimal('basic_salary_total', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            $table->enum('status', ['Draft', 'Final', 'Dibayar'])->default('Draft');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'period_month', 'period_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('bonuses');
        Schema::dropIfExists('overtimes');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('work_schedules');
        Schema::dropIfExists('employee_statuses');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('divisions');
    }
};
