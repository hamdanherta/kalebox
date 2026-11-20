<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('tracking_token')->unique();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            
            // Info Pemesan
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->boolean('is_new_customer')->default(true);

            // Detail Produk & Spesifikasi
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('product_categories')->cascadeOnDelete();
            $table->foreignId('finishing_id')->nullable()->constrained('finishings')->nullOnDelete();
            $table->foreignId('cutting_id')->nullable()->constrained('cuttings')->nullOnDelete();
            $table->enum('design_file_type', ['File Lama', 'File Baru'])->default('File Baru');
            $table->string('design_file_path')->nullable();
            
            // Jumlah & Perhitungan Harga
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2)->default(0);

            // Pembayaran
            $table->enum('payment_method', ['DP', 'Belum Dibayar', 'Lunas'])->default('Belum Dibayar');
            $table->string('payment_status')->default('Belum Dibayar');
            $table->string('payment_proof')->nullable();
            $table->timestamp('payment_expires_at')->nullable();

            // Pengiriman / Penyerahan
            $table->enum('handover_type', ['Ambil Sendiri', 'Dikirim'])->default('Ambil Sendiri');
            $table->text('shipping_address')->nullable();
            $table->date('delivery_date')->nullable(); // Estimasi minimal 3 hari
            $table->date('pickup_or_delivery_date')->nullable();
            $table->text('notes')->nullable();

            // Penugasan Karyawan
            $table->foreignId('designer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();

            // Status Tahapan (6 Status Resmi)
            $table->string('status')->default('Pesanan Telah Masuk');
            
            // Prioritas & Deadline
            $table->boolean('is_high_priority')->default(false);
            $table->dateTime('deadline')->nullable();
            $table->boolean('is_deadline_alert_sent')->default(false);
            $table->boolean('is_ready_notified')->default(false);

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('designer_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('version_number')->default(1);
            $table->string('file_path')->nullable();
            $table->string('preview_image')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('diajukan_ke_admin');
            $table->timestamps();
        });

        Schema::create('order_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('order_design_id')->nullable()->constrained('order_designs')->nullOnDelete();
            $table->text('revision_notes');
            $table->string('reference_image')->nullable();
            $table->string('status')->default('menunggu_tindakan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_revisions');
        Schema::dropIfExists('order_designs');
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('orders');
    }
};
