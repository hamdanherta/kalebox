<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_code')->unique();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('print_type')->nullable(); // jenis cetakan
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('qris_settings', function (Blueprint $table) {
            $table->id();
            $table->string('account_name');
            $table->string('qr_image'); // webp image
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_no')->unique(); // KLB-000001
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone');
            $table->string('email');
            $table->decimal('discount_percent', 5, 2)->default(5.00);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_code')->unique();
            $table->string('name');
            $table->enum('client_type', ['Baru', 'Lama'])->default('Baru');
            $table->string('phone')->index();
            $table->string('email')->nullable()->index();
            $table->boolean('is_member')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
        Schema::dropIfExists('members');
        Schema::dropIfExists('qris_settings');
        Schema::dropIfExists('vendors');
    }
};
