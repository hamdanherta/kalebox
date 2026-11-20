<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE attendances MODIFY status VARCHAR(50) NOT NULL DEFAULT 'Menunggu'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE attendances MODIFY status ENUM('Menunggu', 'Masuk', 'Tidak Masuk', 'Izin', 'Sakit', 'Lembur') NOT NULL DEFAULT 'Menunggu'");
    }
};
