<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->string('manager_approval')->nullable()->after('status');
            $table->text('manager_notes')->nullable()->after('manager_approval');
            $table->text('admin_notes')->nullable()->after('manager_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->dropColumn(['manager_approval', 'manager_notes', 'admin_notes']);
        });
    }
};
